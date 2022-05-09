#!/bin/sh

# If is master, start master
MYIP="1.2.3.4"
ISREADYBODY=$(cat <<-END
    {
        "action": "is_ready",
        "ip_address": "${MYIP}"
    }
END
)
# ISREADYBODY='{"action":"is_ready","ip_address":"${MYIP}"}'
# ISREADYBODY="${ISREADYBODY}"+='"}'
echo "Setting ready and IP: ${MYIP}"
echo "$ISREADYBODY"