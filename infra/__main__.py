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
        {'protocol': 'tcp', 'from_port': 3000, 'to_port': 3000, 'cidr_blocks': ['0.0.0.0/0']},
    ],
    egress=[
        {'protocol': 'tcp', 'from_port': 80, 'to_port': 80, 'cidr_blocks': ['0.0.0.0/0']},
    ]
)

# Configure EC2 instance
server = aws.ec2.Instance(
    'web-server',
    instance_type="t3.nano",
    vpc_security_group_ids=[group.id],
    ami=ami.id,
    user_data="""#!/bin/bash
yum update -y

curl -sL https://rpm.nodesource.com/setup_14.x | bash -
yum install -y nodejs git

git clone -b prod https://github.com/GrantLindquist/dnd-threads.git /home/ec2-user/dnd-threads
cd /home/ec2-user/dnd-threads

npm install
npm run build

nohup next start -p 3000 &
""",
    tags={
      "Name": "dnd-threads",
    },
)

pulumi.export('ip', server.public_ip)
pulumi.export('hostname', server.public_dns)
