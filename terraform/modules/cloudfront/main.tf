resource "aws_cloudfront_origin_access_control" "project1_oac" {
    name = "s3-oac-${var.project1_s3_bucket_origin_id}"
    description = "oac for project1 test distribution"
    origin_access_control_origin_type = "s3"
    signing_behavior = "always"
    signing_protocol = "sigv4"
}



resource "aws_cloudfront_distribution" "project1_test_distribution" {
    origin{
        domain_name = var.project1_bucket_regional_domain_name
        origin_id = var.project1_s3_bucket_origin_id
        origin_access_control_id = aws_cloudfront_origin_access_control.project1_oac.id
    }

    enabled = true
    is_ipv6_enabled = true
    default_root_object = "index.html"

    default_cache_behavior {
      allowed_methods = ["GET", "HEAD"]
      cached_methods = ["GET", "HEAD"]
      target_origin_id = var.project1_s3_bucket_origin_id

      forwarded_values {
        query_string = false
        cookies {
          forward = "none"
        }
      }

      viewer_protocol_policy = "redirect-to-https"
      min_ttl = 0
      default_ttl = 3600
      max_ttl = 86400
    }
    custom_error_response {
      error_code = 403
      response_code = 200
      response_page_path = "/index.html"
    }

    viewer_certificate {
      cloudfront_default_certificate = true
    }

    restrictions{
        geo_restriction {
            restriction_type = "none"
        }
    }

    tags = var.project1_cloudfront_tags

}