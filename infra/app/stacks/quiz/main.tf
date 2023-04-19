module "bucket" {
  source     = "../../modules/s3site"
  bucket     = "${var.env}-${var.bucket_postfix}"
}