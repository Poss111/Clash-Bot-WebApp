resource "aws_iam_policy" "ws_ecr_registry_iam_policy" {
  name = "clash-bot-ws-ecr-ecs-registry-policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = var.ecr_specific_iam_policies,
        Resource = [
          "arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:repository/${var.ws_repository_name}"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "ws_logs_iam_policy" {
  name = "clash-bot-ws-ecs-logs-policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = var.ecs_cloudwatch_policies,
        Resource = [
          "${aws_cloudwatch_log_group.clash-bot-ws-task-logs.arn}:log-stream:*"
        ]
      }
    ]
  })
}

resource "aws_iam_role" "clash-bot-ws-exec-role" {
  name = "${var.prefix}-ws-exec-role"
  assume_role_policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "",
        "Effect" : "Allow",
        "Principal" : {
          "Service" : "ecs-tasks.amazonaws.com"
        },
        "Action" : "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs-ws-ecr-policy-attachment" {
  role       = aws_iam_role.clash-bot-ws-exec-role.name
  policy_arn = aws_iam_policy.webapp_ecr_iam_policy.arn
}

resource "aws_iam_role_policy_attachment" "ecs-ecr-ws-repository-policy-attachment" {
  role       = aws_iam_role.clash-bot-ws-exec-role.name
  policy_arn = aws_iam_policy.ws_ecr_registry_iam_policy.arn
}

resource "aws_iam_role_policy_attachment" "ecs-ws-logs-policy-attachment" {
  role       = aws_iam_role.clash-bot-ws-exec-role.name
  policy_arn = aws_iam_policy.ws_logs_iam_policy.arn
}

resource "aws_lb_target_group" "clash-bot-ws-tg" {
  name        = "${var.prefix}-ws-tg"
  port        = var.ws_service_port
  protocol    = "HTTP"
  vpc_id      = data.tfe_outputs.clash-bot-discord-bot.values.vpc_id
  target_type = "ip"
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    protocol            = "HTTP"
    path                = "/ws/health"
    port                = var.ws_service_port
    timeout             = 10
  }

  tags = {
    Name = "${var.prefix}-ws-ecs-tg"
  }
}

resource "aws_security_group" "clash-bot-ws-task-sg" {
  name   = "${var.prefix}-ws-ecs-task-sg"
  vpc_id = data.tfe_outputs.clash-bot-discord-bot.values.vpc_id

  ingress {
    protocol        = "tcp"
    from_port       = var.ws_service_port
    to_port         = var.ws_service_port
    security_groups = [aws_security_group.clash-bot-webapp-sg.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.prefix}-ecs-task-sg"
  }
}

resource "aws_cloudwatch_log_group" "clash-bot-ws-task-logs" {
  name              = "${var.prefix}-ws-ecs-task-logs"
  retention_in_days = 120
}

resource "aws_ecs_task_definition" "clash-bot-ws-service-task-def" {
  family                   = "${var.prefix}-ws"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.clash-bot-ws-exec-role.arn
  container_definitions = jsonencode([
    {
      name        = "${var.prefix}-ws"
      image       = var.ws_service_image_id
      cpu         = 10
      memory      = 512
      essential   = true
      networkMode = "awsvpc"
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.clash-bot-ws-task-logs.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "${var.prefix}-ws-ecs"
        }
      }
      environment = [
        {
          name : "PORT",
          value : "${tostring(var.ws_service_port)}"
        },
        {
          name : "LOGGER_LEVEL",
          value : var.ws_logger_level
        }
      ]
      portMappings = [
        {
          containerPort = var.ws_service_port
          protocol      = "tcp"
          hostPort      = var.ws_service_port
        }
      ]
    }
  ])

  tags = {
    Name    = "${var.prefix}-task"
    Release = var.release_title
  }
}

resource "aws_ecs_service" "clash-bot-ws-service" {
  name                               = "${var.prefix}-ws-service"
  cluster                            = data.tfe_outputs.clash-bot-discord-bot.values.ecs_id
  task_definition                    = aws_ecs_task_definition.clash-bot-ws-service-task-def.arn
  desired_count                      = var.ws_app_count
  launch_type                        = "FARGATE"
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100
  force_new_deployment               = true

  network_configuration {
    security_groups = [aws_security_group.clash-bot-webapp-task-sg.id]
    subnets         = data.tfe_outputs.clash-bot-discord-bot.values.private_subnet_ids
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.clash-bot-ws-tg.id
    container_name   = aws_ecs_task_definition.clash-bot-ws-service-task-def.family
    container_port   = var.ws_service_port
  }

  depends_on = [aws_lb_listener.clash-bot-webapp-lb-listener]

  tags = {
    Name = "${var.prefix}-ws-ecs-service"
  }
}