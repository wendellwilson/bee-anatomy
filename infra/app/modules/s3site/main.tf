resource "aws_s3_bucket" "mybucket" {
  bucket = var.bucket # If omitted, Terraform will assign a random, unique name.
}

resource "aws_s3_bucket_ownership_controls" "bucket_ownership" {
  bucket = aws_s3_bucket.mybucket.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "bucket_acl" {
  depends_on = [aws_s3_bucket_ownership_controls.bucket_ownership]

  bucket = aws_s3_bucket.mybucket.id
  acl    = "private"
}

resource "aws_s3_bucket_website_configuration" "bucket_website" {
  bucket = aws_s3_bucket.mybucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_versioning" "bucket_versioning" {
  bucket = aws_s3_bucket.mybucket.id
  versioning_configuration {
    status = "Disabled"
  }
}

#Upload files of your static website
resource "aws_s3_object" "html" {
  for_each = fileset(var.dist_directory, "**/*.html")

  bucket = aws_s3_bucket.mybucket.bucket
  key    = each.value
  source = "${var.dist_directory}${each.value}"
  etag   = filemd5("${var.dist_directory}${each.value}")
  content_type = "text/html"
}

resource "aws_s3_object" "svg" {
  for_each = fileset(var.dist_directory, "**/*.ico")

  bucket = aws_s3_bucket.mybucket.bucket
  key    = each.value
  source = "${var.dist_directory}${each.value}"
  etag   = filemd5("${var.dist_directory}${each.value}")
  content_type = "image/x-icon"
}

resource "aws_s3_object" "css" {
  for_each = fileset(var.dist_directory, "**/*.css")

  bucket = aws_s3_bucket.mybucket.bucket
  key    = each.value
  source = "${var.dist_directory}${each.value}"
  etag   = filemd5("${var.dist_directory}${each.value}")
  content_type = "text/css"
}

resource "aws_s3_object" "js" {
  for_each = fileset(var.dist_directory, "**/*.js")

  bucket = aws_s3_bucket.mybucket.bucket
  key    = each.value
  source = "${var.dist_directory}${each.value}"
  etag   = filemd5("${var.dist_directory}${each.value}")
  content_type = "application/javascript"
}


resource "aws_s3_object" "images" {
  for_each = fileset(var.dist_directory, "**/*.jpg")

  bucket = aws_s3_bucket.mybucket.bucket
  key    = each.value
  source = "${var.dist_directory}${each.value}"
  etag   = filemd5("${var.dist_directory}${each.value}")
  content_type = "image/jpg"
}

resource "aws_s3_object" "json" {
  for_each = fileset(var.dist_directory, "**/*.json")

  bucket = aws_s3_bucket.mybucket.bucket
  key    = each.value
  source = "${var.dist_directory}${each.value}"
  etag   = filemd5("${var.dist_directory}${each.value}")
  content_type = "application/json"
}
# Add more aws_s3_object for the type of files you want to upload
# The reason for having multiple aws_s3_object with file type is to make sure
# we add the correct content_type for the file in S3. Otherwise website load may have issues

# Print the files processed so far
output "fileset-results" {
  value = fileset(var.dist_directory, "**/*")
}

locals {
  s3_origin_id = "${var.bucket}.s3-website-us-east-1.amazonaws.com"
}

resource "aws_cloudfront_origin_access_identity" "origin_access_identity" {
  comment = var.bucket
}

resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name = aws_s3_bucket.mybucket.bucket_regional_domain_name
    origin_id   = local.s3_origin_id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.origin_access_identity.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "my-cloudfront"
  default_root_object = "index.html"

  #aliases = ["mywebsite.example.com", "s3-static-web-dev.example.com"]

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "allow-all"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # Cache behavior with precedence 0
  ordered_cache_behavior {
    path_pattern     = "/content/immutable/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false
      headers      = ["Origin"]

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  # Cache behavior with precedence 1
  ordered_cache_behavior {
    path_pattern     = "/content/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  price_class = "PriceClass_200"

  restrictions {
    geo_restriction {
      restriction_type = "none"
      locations        = []
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# to get the Cloud front URL if doamin/alias is not configured
output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.s3_distribution.domain_name
}

data "aws_iam_policy_document" "s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.mybucket.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.origin_access_identity.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "mybucket" {
  bucket = aws_s3_bucket.mybucket.id
  policy = data.aws_iam_policy_document.s3_policy.json
}

resource "aws_s3_bucket_public_access_block" "mybucket" {
  bucket = aws_s3_bucket.mybucket.id

  block_public_acls       = true
  block_public_policy     = true
}
