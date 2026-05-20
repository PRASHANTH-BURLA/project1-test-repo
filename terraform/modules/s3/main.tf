resource "aws_s3_bucket" "project1_test_bucket" {
    bucket = var.project1_test_bucket_name
    force_destroy = true
    tags = var.project1_test_bucket_tags
}

resource "aws_s3_bucket_public_access_block" "project1_block_public" {
    bucket = aws_s3_bucket.project1_test_bucket.id

    block_public_acls = true
    block_public_policy = true
    ignore_public_acls = true
    restrict_public_buckets = true

} 

resource "aws_s3_bucket_versioning" "project1_test_bucket_versioning" {
    bucket = aws_s3_bucket.project1_test_bucket.id
    versioning_configuration {
        status = "Enabled"
    }
}

resource "aws_s3_bucket_lifecycle_configuration" "project1_test_lifecycle" {
    bucket = aws_s3_bucket.project1_test_bucket.id

    rule {
        id = var.project1_test_lifecycle_id
        status = "Enabled"

        filter {}
        noncurrent_version_expiration {
            newer_noncurrent_versions = var.project1_backup_versions_count
            noncurrent_days = var.project1_noncurrent_exp_days
        }

        expiration {
            expired_object_delete_marker = true
        }

        abort_incomplete_multipart_upload {
            days_after_initiation = var.project1_abort_days
        }
    }

}



#Bucket policy

resource "aws_s3_bucket_policy" "allow_cloudfront_project1" {
  bucket = aws_s3_bucket.project1_test_bucket.id
  policy = data.aws_iam_policy_document.project1_s3_policy.json
}

data "aws_iam_policy_document" "project1_s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.project1_test_bucket.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [var.cloudfront_arn] 
    }
  }
}


# aws_cloudfront_distribution.project1_test_distribution.arn