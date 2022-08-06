output "vpc" {
  value       = data.tfe_outputs.clash-bot-discord-bot.vpc_id
  description = "VPC used"
}

output "private_subnets" {
  value       = data.tfe_outputs.clash-bot-discord-bot.private_subnet_ids
  description = "Private subnets used"
}

output "public_subnets" {
  value       = data.tfe_outputs.clash-bot-discord-bot.Public_subnet_ids
  description = "Public subnets used"
}

output "ecs_name" {
  value       = data.tfe_outputs.clash-bot-discord-bot.ecs_name
  description = "ECS Name used"
}

output "ecs_id" {
  value       = data.tfe_outputs.clash-bot-discord-bot.ecs_id
  description = "ECS Id used"
}

output "ecs_webapp_service_name" {
  value       = aws_ecs_service.clash-bot-webapp-service.name
  description = "Webapp ECS Service Name"
}

output "ecs_ws_service_name" {
  value       = aws_ecs_service.clash_bot_ws_service.name
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
