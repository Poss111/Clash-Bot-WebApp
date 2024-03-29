terraform {
  cloud {
    organization = "ClashBot"

    workspaces {
      name = "ClashBot-Webapp"
    }
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "4.21.0"
    }
  }
}

provider "aws" {
  access_key = var.access_key
  secret_key = var.secret_key
  region     = var.region

  default_tags {
    tags = {
      Application = "Clash-Bot-Webapp"
      Type        = "Webapp"
    }
  }
}

data "tfe_outputs" "clash-bot-discord-bot" {
  organization = "ClashBot"
  workspace    = "ClashBot"
}

data "aws_caller_identity" "current" {}


resource "aws_iam_policy" "webapp_dynamodb_iam_policy" {
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

resource "aws_iam_policy" "webapp_ecr_iam_policy" {
  name = "clash-bot-webapp-ecr-ecs-policy"
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

resource "aws_iam_policy" "webapp_ecr_registry_iam_policy" {
  name = "clash-bot-webapp-ecr-ecs-registry-policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = var.ecr_specific_iam_policies,
        Resource = [
          "arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:repository/${var.webapp_repository_name}"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "webapp_logs_iam_policy" {
  name = "clash-bot-webapp-ecs-logs-policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = var.ecs_cloudwatch_policies,
        Resource = [
          "${aws_cloudwatch_log_group.clash-bot-webapp-task-logs.arn}:log-stream:*"
        ]
      }
    ]
  })
}

resource "aws_iam_role" "clash-bot-webapp-exec-role" {
  name = "${var.prefix}-webapp-exec-role"
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

resource "aws_iam_role" "clash-bot-webapp-task-role" {
  name = "${var.prefix}-webapp-task-role"
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
  role       = aws_iam_role.clash-bot-webapp-exec-role.name
  policy_arn = aws_iam_policy.webapp_ecr_iam_policy.arn
}

resource "aws_iam_role_policy_attachment" "ecs-ecr-repository-policy-attachment" {
  role       = aws_iam_role.clash-bot-webapp-exec-role.name
  policy_arn = aws_iam_policy.webapp_ecr_registry_iam_policy.arn
}

resource "aws_iam_role_policy_attachment" "ecs-logs-policy-attachment" {
  role       = aws_iam_role.clash-bot-webapp-exec-role.name
  policy_arn = aws_iam_policy.webapp_logs_iam_policy.arn
}

resource "aws_iam_role_policy_attachment" "ecs-dynamodb-policy-attachment" {
  role       = aws_iam_role.clash-bot-webapp-task-role.name
  policy_arn = aws_iam_policy.webapp_dynamodb_iam_policy.arn
}

resource "aws_lb_target_group" "clash-bot-webapp-tg" {
  name        = "${var.prefix}-webapp-tg"
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

resource "aws_security_group" "clash-bot-webapp-task-sg" {
  name   = "${var.prefix}-ecs-task-sg"
  vpc_id = data.tfe_outputs.clash-bot-discord-bot.values.vpc_id

  ingress {
    protocol        = "tcp"
    from_port       = var.service_port
    to_port         = var.service_port
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

resource "aws_cloudwatch_log_group" "clash-bot-webapp-task-logs" {
  name              = "${var.prefix}-ecs-task-logs"
  retention_in_days = 120
}

resource "aws_dynamodb_table" "clash-bot-teams-table" {
  name           = var.clash-bot-teams-dynamo-table
  billing_mode   = "PROVISIONED"
  read_capacity  = 10
  write_capacity = 1
  hash_key       = "serverName"
  range_key      = "details"

  attribute {
    name = "serverName"
    type = "S"
  }

  attribute {
    name = "details"
    type = "S"
  }
}

resource "aws_dynamodb_table" "clash-bot-association-table" {
  name           = var.clash-bot-association-dynamo-table
  billing_mode   = "PROVISIONED"
  read_capacity  = 10
  write_capacity = 1
  hash_key       = "playerId"
  range_key      = "association"

  attribute {
    name = "playerId"
    type = "S"
  }

  attribute {
    name = "association"
    type = "S"
  }
}

resource "aws_ecs_task_definition" "clash-bot-webapp-task-def" {
  family                   = "${var.prefix}-service"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.clash-bot-webapp-exec-role.arn
  task_role_arn            = aws_iam_role.clash-bot-webapp-task-role.arn
  container_definitions = jsonencode([
    {
      name        = "${var.prefix}-service"
      image       = var.service_image_id
      cpu         = 10
      memory      = 512
      essential   = true
      networkMode = "awsvpc"
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.clash-bot-webapp-task-logs.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "${var.prefix}-service-ecs"
        }
      }
      environment = [
        {
          name : "WS_SERVICE_HOSTNAME",
          value : "ws://${aws_lb.clash-bot-webapp-lb.dns_name}"
        },
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
          value : var.webapp_logger_level
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

resource "aws_ecs_service" "clash-bot-webapp-service" {
  name                               = "${var.prefix}-service"
  cluster                            = data.tfe_outputs.clash-bot-discord-bot.values.ecs_id
  task_definition                    = aws_ecs_task_definition.clash-bot-webapp-task-def.arn
  desired_count                      = var.app_count
  launch_type                        = "FARGATE"
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100
  force_new_deployment               = true

  network_configuration {
    security_groups = [aws_security_group.clash-bot-webapp-task-sg.id]
    subnets         = data.tfe_outputs.clash-bot-discord-bot.values.private_subnet_ids
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.clash-bot-webapp-tg.id
    container_name   = aws_ecs_task_definition.clash-bot-webapp-task-def.family
    container_port   = var.service_port
  }

  depends_on = [aws_lb_listener.clash-bot-webapp-lb-listener, aws_dynamodb_table.clash-bot-teams-table, aws_dynamodb_table.clash-bot-association-table]

  tags = {
    Name = "${var.prefix}-ecs-service"
  }
}

