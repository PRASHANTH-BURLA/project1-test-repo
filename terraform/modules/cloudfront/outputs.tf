output "project1_distribution_id" {
    description = "This is project1 test cloudfront distribution id"
    value = aws_cloudfront_distribution.project1_test_distribution.id
}

output "project1_distribution_arn" {
    description = "This is project1 test cloudfront distribution arn"
    value = aws_cloudfront_distribution.project1_test_distribution.arn
}

output "website_url" {
    description = "This is the url for project1 test website"
    value = aws_cloudfront_distribution.project1_test_distribution.domain_name
}