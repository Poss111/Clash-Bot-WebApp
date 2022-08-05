output "ecs-name" {
  value       = aws_ecs_cluster.clash-bot-ecs.name
  description = "ECS Name"
}

output "webapp_task_definition_version" {
  value       = aws_ecs_task_definition.clash-bot-webapp-task-def.revision
  description = "Webapp Task definition revision"
}

output "ws_task_definition_version" {
  value       = aws_ecs_task_definition.clash-bot-ws-service-task-def.revision
  description = "WS Task definition revision"
}
