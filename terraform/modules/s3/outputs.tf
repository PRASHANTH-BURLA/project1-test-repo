output "project1_bucket_id" {
    description = "This is project1 test bucket name"
    value = aws_s3_bucket.project1_test_bucket.id
}

output "project1_bucket_arn" {
    description = "This is project1 test bucket arn"
    value = aws_s3_bucket.project1_test_bucket.arn
}

output "project1_bucket_policy_id" {
    description = "This is project1 bucket policy id"
    value = aws_s3_bucket_policy.allow_cloudfront_project1.id
}

output "project1_regional_domain_name" {
    value = aws_s3_bucket.project1_test_bucket.bucket_regional_domain_name
}

