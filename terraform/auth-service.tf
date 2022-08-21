data "aws_iam_policy_document" "clash-bot-auth-secret-policy" {
  statement {
    actions = [
      "secretsmanager:GetSecret",
      "secretsmanager:GetSecretValue"
    ]
    principals {
      identifiers = [
        "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${aws_iam_role_policy_attachment.ecs-secret-policy-attachment.role}"
      ]
      type = "AWS"
    }
    resources = ["*"]
  }
}

resource "aws_secretsmanager_secret" "one" {
  name                    = var.secret_one["name"]
  policy                  = data.aws_iam_policy_document.clash-bot-auth-secret-policy.json
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "one_version" {
  secret_id     = aws_secretsmanager_secret.one.id
  secret_string = var.secret_one["value"]
}

resource "aws_secretsmanager_secret" "two" {
  name                    = var.secret_two["name"]
  policy                  = data.aws_iam_policy_document.clash-bot-auth-secret-policy.json
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "two_version" {
  secret_id     = aws_secretsmanager_secret.two.id
  secret_string = var.secret_two["value"]
}

resource "aws_iam_policy" "auth_dynamodb_iam_policy" {
  name = "clash-bot-dynamodb-ecs-policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = var.dynamodb_specific_iam_policies,
        Resource = ["*"]
      }
    ]
  })
}

resource "aws_iam_policy" "auth_ecr_iam_policy" {
  name = "clash-bot-auth-ecr-ecs-policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = var.registry_ecr_iam_policies,
        Resource = ["*"]
      }
    ]
  })
}

resource "aws_iam_policy" "auth_ecr_registry_iam_policy" {
  name = "clash-bot-auth-ecr-ecs-registry-policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = var.ecr_specific_iam_policies,
        Resource = [
          "arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:repository/${var.auth_repository_name}"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "auth_logs_iam_policy" {
  name = "clash-bot-auth-ecs-logs-policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = var.ecs_cloudwatch_policies,
        Resource = [
          "${aws_cloudwatch_log_group.clash-bot-auth-task-logs.arn}:log-stream:*"
        ]
      }
    ]
  })
}

resource "aws_iam_role" "clash-bot-auth-exec-role" {
  name = "${var.prefix}-auth-exec-role"
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

resource "aws_iam_role" "clash-bot-auth-task-role" {
  name = "${var.prefix}-auth-task-role"
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

resource "aws_iam_role_policy_attachment" "ecs-ecr-policy-attachment" {
  role       = aws_iam_role.clash-bot-auth-exec-role.name
  policy_arn = aws_iam_policy.auth_ecr_iam_policy.arn
}

resource "aws_iam_role_policy_attachment" "ecs-ecr-repository-policy-attachment" {
  role       = aws_iam_role.clash-bot-auth-exec-role.name
  policy_arn = aws_iam_policy.auth_ecr_registry_iam_policy.arn
}

resource "aws_iam_role_policy_attachment" "ecs-logs-policy-attachment" {
  role       = aws_iam_role.clash-bot-auth-exec-role.name
  policy_arn = aws_iam_policy.auth_logs_iam_policy.arn
}

resource "aws_iam_role_policy_attachment" "ecs-dynamodb-policy-attachment" {
  role       = aws_iam_role.clash-bot-auth-task-role.name
  policy_arn = aws_iam_policy.auth_dynamodb_iam_policy.arn
}

resource "aws_iam_role_policy_attachment" "ecs-secret-policy-attachment" {
  role       = aws_iam_role.clash-bot-auth-task-role.name
  policy_arn = aws_iam_policy.auth_dynamodb_iam_policy.arn
}

resource "aws_lb_target_group" "clash-bot-auth-tg" {
  name        = "${var.prefix}-auth-tg"
  port        = var.service_port
  protocol    = "HTTP"
  vpc_id      = data.tfe_outputs.clash-bot-discord-bot.values.vpc_id
  target_type = "ip"
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    protocol            = "HTTP"
    path                = "/api/v2/health"
    port                = var.service_port
    timeout             = 10
  }

  tags = {
    Name = "${var.prefix}-ecs-tg"
  }
}

resource "aws_security_group" "clash-bot-auth-task-sg" {
  name   = "${var.prefix}-ecs-task-sg"
  vpc_id = data.tfe_outputs.clash-bot-discord-bot.values.vpc_id

  ingress {
    protocol        = "tcp"
    from_port       = var.service_port
    to_port         = var.service_port
    security_groups = [aws_security_group.clash-bot-auth-task-sg.id]
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

resource "aws_cloudwatch_log_group" "clash-bot-auth-task-logs" {
  name              = "${var.prefix}-auth-ecs-task-logs"
  retention_in_days = 120
}

resource "aws_ecs_task_definition" "clash-bot-auth-task-def" {
  family                   = "${var.prefix}-service"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.clash-bot-auth-exec-role.arn
  task_role_arn            = aws_iam_role.clash-bot-auth-task-role.arn
  container_definitions = jsonencode([
    {
      name        = "${var.prefix}-auth-service"
      image       = var.service_image_id
      cpu         = 10
      memory      = 512
      essential   = true
      networkMode = "awsvpc"
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.clash-bot-auth-task-logs.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "${var.prefix}-service-ecs"
        }
      }
      environment = [
        {
          name : "PORT",
          value : "${tostring(var.service_port)}"
        },
        {
          name : "REGION",
          value : var.region
        },
        {
          name : "LOGGER_LEVEL",
          value : var.auth_logger_level
        }
      ]
      secrets = [
        {
          name : var.secret_one["name"]
          valueFrom : aws_secretsmanager_secret_version.one_version.arn
        },
        {
          name = var.secret_two["name"]
          valueFrom : aws_secretsmanager_secret_version.two_version.arn
        }
      ]
      portMappings = [
        {
          containerPort = var.service_port
          protocol      = "tcp"
          hostPort      = var.service_port
        }
      ]
    }
  ])

  tags = {
    Name    = "${var.prefix}-task"
    Release = var.release_title
  }
}

resource "aws_ecs_service" "clash-bot-auth-service" {
  name                               = "${var.prefix}-auth-service"
  cluster                            = data.tfe_outputs.clash-bot-discord-bot.values.ecs_id
  task_definition                    = aws_ecs_task_definition.clash-bot-auth-task-def.arn
  desired_count                      = var.app_count
  launch_type                        = "FARGATE"
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100

  network_configuration {
    security_groups = [aws_security_group.clash-bot-auth-task-sg.id]
    subnets         = data.tfe_outputs.clash-bot-discord-bot.values.private_subnet_ids
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.clash-bot-auth-tg.id
    container_name   = aws_ecs_task_definition.clash-bot-auth-task-def.family
    container_port   = var.service_port
  }

  depends_on = [aws_lb_listener.clash-bot-webapp-lb-listener]

  tags = {
    Name = "${var.prefix}-ecs-service"
  }
}

