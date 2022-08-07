resource "aws_lb" "clash-bot-webapp-lb" {
  name            = "${var.prefix}-lb"
  subnets         = data.tfe_outputs.clash-bot-discord-bot.values.public_subnet_ids
  security_groups = [aws_security_group.clash-bot-webapp-sg.id]

  tags = {
    Name = "${var.prefix}-lb"
  }
}

resource "aws_security_group" "clash-bot-webapp-sg" {
  name   = "${var.prefix}-alb-sg"
  vpc_id = data.tfe_outputs.clash-bot-discord-bot.values.vpc_id

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

resource "aws_lb_listener" "clash-bot-webapp-lb-listener" {
  load_balancer_arn = aws_lb.clash-bot-webapp-lb.id
  port              = var.service_port
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Not Found."
      status_code  = "404"
    }
  }
}

resource "aws_lb_listener_rule" "webapp_safe_traffic" {
  listener_arn = aws_lb_listener.clash-bot-webapp-lb-listener.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.clash-bot-webapp-tg.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

resource "aws_lb_listener_rule" "ws_safe_traffic" {
  listener_arn = aws_lb_listener.clash-bot-webapp-lb-listener.arn
  priority     = 101

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.clash-bot-ws-tg.arn
  }

  condition {
    path_pattern {
      values = ["/ws/*"]
    }
  }
}