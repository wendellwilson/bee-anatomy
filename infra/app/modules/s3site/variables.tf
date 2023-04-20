variable "bucket" {
  description = "The name of the bucket. If omitted, Terraform will assign a random, unique name." # IE: terraform-2020052606510241590000000
  type        = string
  default     = null
}

variable "dist_directory" {
  description = "directory to copy to s3"
  type        = string
  default     = null
}