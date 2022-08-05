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

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available_zones" {
  state = "available"
}

resource "aws_iam_role_policy_attachment" "clash_bot_policy_attachment" {
  policy_arn = aws_iam_policy.clash-bot-iam-policy.arn
  role       = aws_iam_role.clash-bot-webapp-exec-role.name
}

resource "aws_iam_policy" "clash-bot-iam-policy" {
  name = "secrets-policy"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action   = var.iam_secret_policies,
        Effect   = "Allow",
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_policy" "ecr_iam_policy" {
  name = "ecr-ecs-policy"
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
  name = "ecr-ecs-registry-policy"
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

resource "aws_iam_policy" "ws_ecr_registry_iam_policy" {
  name = "ecr-ecs-registry-policy"
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

resource "aws_iam_policy" "webapp_logs_iam_policy" {
  name = "ecs-logs-policy"
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

resource "aws_iam_policy" "ws_logs_iam_policy" {
  name = "ecs-logs-policy"
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

resource "aws_iam_role_policy_attachment" "ecs-ecr-policy-attachment" {
  role       = aws_iam_role.clash-bot-webapp-exec-role.name
  policy_arn = aws_iam_policy.ecr_iam_policy.arn
}

resource "aws_iam_role_policy_attachment" "ecs-ecr-repository-policy-attachment" {
  role       = aws_iam_role.clash-bot-webapp-exec-role.name
  policy_arn = aws_iam_policy.webapp_ecr_registry_iam_policy.arn
}

resource "aws_iam_role_policy_attachment" "ecs-logs-policy-attachment" {
  role       = aws_iam_role.clash-bot-webapp-exec-role.name
  policy_arn = aws_iam_policy.webapp_logs_iam_policy.arn
}

resource "aws_iam_role_policy_attachment" "ecs-ecr-policy-attachment" {
  role       = aws_iam_role.clash-bot-ws-exec-role.name
  policy_arn = aws_iam_policy.ecr_iam_policy.arn
}

resource "aws_iam_role_policy_attachment" "ecs-ecr-repository-policy-attachment" {
  role       = aws_iam_role.clash-bot-ws-exec-role.name
  policy_arn = aws_iam_policy.ws_ecr_registry_iam_policy.arn
}

resource "aws_iam_role_policy_attachment" "ecs-logs-policy-attachment" {
  role       = aws_iam_role.clash-bot-ws-exec-role.name
  policy_arn = aws_iam_policy.ws_logs_iam_policy.arn
}

resource "aws_vpc" "clash-bot-vpc" {
  cidr_block = "172.0.0.0/20"
  tags = {
    Name = "${var.prefix}-vpc"
  }
}

resource "aws_subnet" "clash-bot-subnet-public" {
  count                   = 2
  cidr_block              = cidrsubnet(aws_vpc.clash-bot-vpc.cidr_block, 8, 2 + count.index)
  availability_zone       = data.aws_availability_zones.available_zones.names[count.index]
  vpc_id                  = aws_vpc.clash-bot-vpc.id
  map_public_ip_on_launch = true
  tags = {
    Name = "${var.prefix}-${count.index}-public"
  }
}

resource "aws_subnet" "clash-bot-subnet-private" {
  count             = 2
  cidr_block        = cidrsubnet(aws_vpc.clash-bot-vpc.cidr_block, 8, count.index)
  availability_zone = data.aws_availability_zones.available_zones.names[count.index]
  vpc_id            = aws_vpc.clash-bot-vpc.id
  tags = {
    Name = "${var.prefix}-${count.index}-private"
  }
}

resource "aws_internet_gateway" "gateway" {
  vpc_id = aws_vpc.clash-bot-vpc.id
  tags = {
    Name = "${var.prefix}-ig"
  }
}

resource "aws_route" "internet_access" {
  route_table_id         = aws_vpc.clash-bot-vpc.main_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.gateway.id
}

resource "aws_eip" "clash-bot-eip-gateway" {
  count      = 2
  vpc        = true
  depends_on = [aws_internet_gateway.gateway]
  tags = {
    Name = "${var.prefix}-eip"
  }
}

resource "aws_nat_gateway" "clash-bot-gateway" {
  count         = 2
  subnet_id     = element(aws_subnet.clash-bot-subnet-public.*.id, count.index)
  allocation_id = element(aws_eip.clash-bot-eip-gateway.*.id, count.index)
  tags = {
    Name = "${var.prefix}-nat-gateway"
  }
}

resource "aws_route_table" "clash-bot-rt-private" {
  count  = 2
  vpc_id = aws_vpc.clash-bot-vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = element(aws_nat_gateway.clash-bot-gateway.*.id, count.index)
  }

  tags = {
    Name = "${var.prefix}-rt"
  }
}

resource "aws_route_table_association" "clash-bot-rta-private" {
  count          = 2
  subnet_id      = element(aws_subnet.clash-bot-subnet-private.*.id, count.index)
  route_table_id = element(aws_route_table.clash-bot-rt-private.*.id, count.index)
}

resource "aws_security_group" "clash-bot-webapp-sg" {
  name   = "${var.prefix}-alb-sg"
  vpc_id = aws_vpc.clash-bot-vpc.id

  ingress {
    protocol    = "tcp"
    from_port   = var.service_port
    to_port     = var.service_port
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.prefix}-alb-sg"
  }
}

resource "aws_lb" "clash-bot-webapp-lb" {
  name            = "${var.prefix}-lb"
  subnets         = aws_subnet.clash-bot-subnet-public.*.id
  security_groups = [aws_security_group.clash-bot-webapp-sg.id]

  tags = {
    Name = "${var.prefix}-lb"
  }
}

resource "aws_lb" "clash-bot-ws-lb" {
  name            = "${var.prefix}-ws-lb"
  subnets         = aws_subnet.clash-bot-subnet-public.*.id
  security_groups = [aws_security_group.clash-bot-webapp-sg.id]

  tags = {
    Name = "${var.prefix}-ws-lb"
  }
}

resource "aws_lb_target_group" "clash-bot-webapp-tg" {
  name        = "${var.prefix}-webapp-tg"
  port        = var.ws_service_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.clash-bot-vpc.id
  target_type = "ip"
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    protocol            = "HTTP"
    path                = "/health"
    port                = var.ws_service_port
    timeout             = 10
  }

  tags = {
    Name = "${var.prefix}-ecs-tg"
  }
}

resource "aws_lb_target_group" "clash-bot-ws-tg" {
  name        = "${var.prefix}-ws-tg"
  port        = var.ws_service_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.clash-bot-vpc.id
  target_type = "ip"
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    protocol            = "HTTP"
    path                = "/health"
    port                = var.ws_service_port
    timeout             = 10
  }

  tags = {
    Name = "${var.prefix}-ws-ecs-tg"
  }
}

resource "aws_lb_listener" "clash-bot-webapp-lb-listener" {
  load_balancer_arn = aws_lb.clash-bot-webapp-lb.id
  port              = "${var.service_port}"
  protocol          = "HTTP"

  default_action {
    target_group_arn = aws_lb_target_group.clash-bot-webapp-tg.id
    type             = "forward"
  }
}

resource "aws_lb_listener" "clash-bot-ws-lb-listener" {
  load_balancer_arn = aws_lb.clash-bot-ws-lb.id
  port              = "${var.ws_service_port}"
  protocol          = "HTTP"

  default_action {
    target_group_arn = aws_lb_target_group.clash-bot-ws-tg.id
    type             = "forward"
  }
}

resource "aws_security_group" "clash-bot-webapp-task-sg" {
  name   = "${var.prefix}-ecs-task-sg"
  vpc_id = aws_vpc.clash-bot-vpc.id

  ingress {
    protocol        = "tcp"
    from_port       = var.service_port
    to_port         = var.service_port
    security_groups = [aws_security_group.clash-bot-webapp-sg.id]
  }

  ingress {
    protocol        = "tcp"
    from_port       = 80
    to_port         = 80
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

resource "aws_cloudwatch_log_group" "clash-bot-ws-task-logs" {
  name              = "${var.prefix}-ws-ecs-task-logs"
  retention_in_days = 120
}

resource "aws_ecs_task_definition" "clash-bot-webapp-task-def" {
  family                   = "${var.prefix}-service"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.clash-bot-webapp-exec-role.arn
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
          name: "WS_SERVICE_HOSTNAME",
          value: aws_lb.clash-bot-ws-lb.dns_name
        },
        {
          name: "PORT",
          value: var.service_port
        },
        {
          name: "REGION",
          value: var.region
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
          name: "PORT",
          value: var.ws_service_port
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

resource "aws_ecs_service" "clash-bot-webapp-service" {
  name                               = "${var.prefix}-service"
  cluster                            = aws_ecs_cluster.clash-bot-ecs.id
  task_definition                    = aws_ecs_task_definition.clash-bot-webapp-task-def.arn
  desired_count                      = var.app_count
  launch_type                        = "FARGATE"
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100

  network_configuration {
    security_groups = [aws_security_group.clash-bot-webapp-task-sg.id]
    subnets         = aws_subnet.clash-bot-subnet-private.*.id
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.clash-bot-webapp-tg.id
    container_name   = aws_ecs_task_definition.clash-bot-webapp-task-def.family
    container_port   = var.service_port
  }

  depends_on = [aws_lb_listener.clash-bot-webapp-lb-listener]

  tags = {
    Name = "${var.prefix}-ecs-service"
  }
}

resource "aws_ecs_service" "clash-bot-ws-service" {
  name                               = "${var.prefix}-ws-service"
  cluster                            = aws_ecs_cluster.clash-bot-ecs.id
  task_definition                    = aws_ecs_task_definition.clash-bot-ws-service-task-def.arn
  desired_count                      = var.app_count
  launch_type                        = "FARGATE"
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100

  network_configuration {
    security_groups = [aws_security_group.clash-bot-webapp-task-sg.id]
    subnets         = aws_subnet.clash-bot-subnet-private.*.id
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.clash-bot-webapp-tg.id
    container_name   = aws_ecs_task_definition.clash-bot-ws-service-task-def.family
    container_port   = var.ws_service_port
  }

  depends_on = [aws_lb_listener.clash-bot-webapp-lb-listener]

  tags = {
    Name = "${var.prefix}-ecs-service"
  }
}

resource "aws_ecs_cluster" "clash-bot-ecs" {
  name = "${var.prefix}-ecs"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.prefix}-ecs"
  }
}

