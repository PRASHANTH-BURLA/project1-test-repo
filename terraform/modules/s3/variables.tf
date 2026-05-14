variable "project1_test_bucket_name" {
    type = string
}

variable "project1_test_bucket_tags" {
    type = map(string)
}

variable "project1_test_lifecycle_id" {
    type = string
}

variable "project1_backup_versions_count" {
    type = number
}

variable "project1_noncurrent_exp_days" {
    type = number
}

variable "project1_abort_days" {
    type = number
}

variable "cloudfront_arn" {
    type = string
}