variable "access_key" {
  description = "Access Key"
  type        = string
  sensitive   = true
}

variable "secret_key" {
  description = "Secret Key"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "AWS Region"
  default     = "us-east-1"
  type        = string
  sensitive   = true
}

variable "release_title" {
  type    = string
  default = "Awesome_Sauce"
}

variable "app_count" {
  type    = number
  default = 1
}

variable "service_image_id" {
  type        = string
  description = "Image url to deploy"
  sensitive   = true
}

variable "service_port" {
  type        = number
  description = "Port to be used for service"
}

variable "ws_service_image_id" {
  type        = string
  description = "Image url to deploy"
  sensitive   = true
}

variable "ws_service_port" {
  type        = number
  description = "Port to be used for the ws service"
}

variable "prefix" {
  type        = string
  description = "Prefix to set for the resources"
  default     = "clash-bot-webapp"
}

variable "one" {
  type      = map(string)
  sensitive = true
}

variable "webapp_repository_name" {
  default = ""
}

variable "ws_repository_name" {
  default = ""
}

variable "iam_secret_policies" {
  type      = list(string)
  sensitive = true
}

variable "ecs_iam_secret_policies" {
  type      = list(string)
  sensitive = true
}

variable "ecs_cloudwatch_policies" {
  type      = list(string)
  sensitive = true
}

variable "registry_ecr_iam_policies" {
  type      = list(string)
  sensitive = true
}

variable "ecr_specific_iam_policies" {
  type      = list(string)
  sensitive = true
}