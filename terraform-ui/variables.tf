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

variable "s3_bucket_name" {
  type = string
}

variable "domain" {
  type      = string
  sensitive = true
}
