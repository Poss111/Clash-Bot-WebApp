output "ecs_webapp_service_name" {
  value       = aws_ecs_service.clash-bot-webapp-service.name
  description = "Webapp ECS Service Name"
}

output "ecs_ws_service_name" {
  value       = aws_ecs_service.clash-bot-ws-service.name
  description = "WS ECS Service Name"
}

output "webapp_task_definition_version" {
  value       = aws_ecs_task_definition.clash-bot-webapp-task-def.revision
  description = "Webapp Task definition revision"
}

output "ws_task_definition_version" {
  value       = aws_ecs_task_definition.clash-bot-ws-service-task-def.revision
  description = "WS Task definition revision"
}

output "webapp_lb_url" {
  value     = aws_lb.clash-bot-webapp-lb.dns_name
  sensitive = true
}
