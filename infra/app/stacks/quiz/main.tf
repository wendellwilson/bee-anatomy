locals {
  project_path = split("infra", abspath(path.root))[0]
}

module "bucket" {
  source     = "../../modules/s3site"
  bucket     = "${var.env}-${var.bucket_postfix}"
  dist_directory = "${local.project_path}dist/"
}
