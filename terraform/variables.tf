variable "region" {
    type = string
}

variable "bucket_name" {
    type = string
}

variable "bucket_tags" {
  type = map(string)
}

variable "lifecycle_rule_id" {
    type = string
}

variable "backup_versions_count" {
    type = number
}

variable "noncurrent_exp_days" {
    type = number
}

variable "incomplete_upload_abort_days" {
    type = number
}


#cloudfront

# variable "bucket_origin_id" {
#     type = string
# }

# variable "bucket_regional_domain_name" {
#     type = string
# }

variable "cloudfront_tags" {
    type = map(string)
}