provider "aws" {
    region = var.region
}

terraform {
  cloud {
    organization = "terraform_study_org"
    
    workspaces {
      name = "project1-test-workspace"
    }
  }
}


module "s3_module" {
  source = "./modules/s3"
  cloudfront_arn = module.cloudfront_module.project1_distribution_arn
  project1_test_bucket_name = var.bucket_name
  project1_test_bucket_tags = var.bucket_tags
  project1_test_lifecycle_id = var.lifecycle_rule_id
  project1_backup_versions_count = var.backup_versions_count
  project1_noncurrent_exp_days = var.noncurrent_exp_days
  project1_abort_days = var.incomplete_upload_abort_days
}


module "cloudfront_module" {
  source = "./modules/cloudfront"
  project1_s3_bucket_origin_id = module.s3_module.project1_bucket_id
  # project1_s3_bucket_origin_id = var.bucket_origin_id
  project1_bucket_regional_domain_name = module.s3_module.project1_regional_domain_name
  # project1_bucket_regional_domain_name = var.bucket_regional_domain_name
  project1_cloudfront_tags = var.cloudfront_tags
}