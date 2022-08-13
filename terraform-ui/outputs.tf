output "s3_bucket" {
  value     = aws_s3_bucket.clash-bot-webapp-s3-bucket.bucket_domain_name
  sensitive = true
}
