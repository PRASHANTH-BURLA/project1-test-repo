region = "ap-south-2"
bucket_name = "project1-staticwebsite-test-bucket-001"
bucket_tags = {
    Name = "project1-test-bucket-001"
    Project = "study project1"
}
lifecycle_rule_id = "with-rule-clean-old-versions"
backup_versions_count = 1
noncurrent_exp_days = 10
incomplete_upload_abort_days = 7


#cloudfront

# bucket_origin_id = "project1-test-bucket-001"
cloudfront_tags = {
  Project = "study project1"
}