import pulumi
import pulumi_aws as aws

# Configure Amazon Machine Image - required to host EC2
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["137112412989"],
    filters=[{"name":"name","values":["amzn2-ami-hvm-*-x86_64-gp2"]}])

# Configure default vpc and security group
vpc = aws.ec2.get_vpc(default=True)
group = aws.ec2.SecurityGroup(
    "web-secgrp",
    description="Enable HTTP Access for IaC lab",
    vpc_id=vpc.id,
    ingress=[
        {'protocol': 'icmp', 'from_port': 8, 'to_port': 0, 'cidr_blocks': ['0.0.0.0/0']},
        {'protocol': 'tcp', 'from_port': 80, 'to_port': 80, 'cidr_blocks': ['0.0.0.0/0']},
    ],
    egress=[
        {'protocol': 'tcp', 'from_port': 80, 'to_port': 80, 'cidr_blocks': ['0.0.0.0/0']},
    ]
)

# Configure EC2 instance
server = aws.ec2.Instance(
    'web-server',
    instance_type="t2.micro",
    vpc_security_group_ids=[group.id],
    ami=ami.id,
    user_data="""#!/bin/bash
echo \"Hello, World!\" > index.html
nohup python -m SimpleHTTPServer 80 &
""",
    tags={
      "Name": "web-server",
    },
)

pulumi.export('ip', server.public_ip)
pulumi.export('hostname', server.public_dns)
