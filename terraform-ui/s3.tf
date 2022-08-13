terraform {
  cloud {
    organization = "ClashBot"

    workspaces {
      name = "ClashBot-UI"
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
      Application = "ClashBot-UI"
      Type        = "UI"
    }
  }
}

resource "aws_s3_bucket" "clash-bot-webapp-s3-bucket" {
  bucket = var.s3_bucket_name
}

resource "aws_s3_bucket_policy" "clash-bot-webapp-s3-bucket-policy" {
  bucket = aws_s3_bucket.clash-bot-webapp-s3-bucket.id
  policy = data.aws_iam_policy_document.static_hosting_policy.json
}

data "aws_iam_policy_document" "static_hosting_policy" {
  statement {
    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = [
      "s3:GetObject",
      "s3:ListBucket",
    ]

    resources = [
      aws_s3_bucket.clash-bot-webapp-s3-bucket.arn,
      "${aws_s3_bucket.clash-bot-webapp-s3-bucket.arn}/*",
    ]
  }
}

resource "aws_s3_bucket_acl" "clash_bot_webapp_s3_bucket" {
  bucket = aws_s3_bucket.clash-bot-webapp-s3-bucket.id
  acl    = "public-read"
}

resource "aws_s3_bucket_website_configuration" "clash_bot_webapp_s3_website_conf" {
  bucket = aws_s3_bucket.clash-bot-webapp-s3-bucket.bucket

  index_document {
    suffix = "index.html"
  }

  routing_rule {
    condition {
      http_error_code_returned_equals = "404"
    }
    redirect {
      host_name        = var.domain
      protocol         = "https"
      replace_key_with = "index.html"
    }
  }
}

resource "aws_s3_bucket_acl" "clash-bot-webapp-bucket_acl" {
  bucket = aws_s3_bucket.clash-bot-webapp-s3-bucket.id
  acl    = "private"
}
