output "bucket_id" {
    description = "This is project1 test bucket id"
    value = module.s3_module.project1_bucket_id
}

output "bucket_arn" {
    description = "This is project1 test bucket arn"
    value = module.s3_module.project1_bucket_arn
}

output "bucket_policy_id" {
    description = "This is project1 bucket policy id"
    value = module.s3_module.project1_bucket_policy_id
}

output "project1_bucket_reg_domain_name" {
    description = "This is project1 bucket regional domain name"
    value = module.s3_module.project1_regional_domain_name
}

#cloudfront

output "project1_cloudfront_distribution_id" {
    description = "This is the project1 cloudfront distribution id"
    value = module.cloudfront_module.project1_distribution_id
}

output "project1_cloudfront_distribution_arn" {
    description = "This is project1 cloudfront distribution arn"
    value = module.cloudfront_module.project1_distribution_arn
}

output "project1_test_website_url" {
    description = "This is the url for project1 test website"
    value = "https://${module.cloudfront_module.website_url}"
}
