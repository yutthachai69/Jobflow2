import { Client, FlexMessage, TextMessage } from '@line/bot-sdk';

// Lazy initialization of LINE client to prevent build-time errors
const getLineClient = () => {
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
        return null;
    }
    return new Client({
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
        channelSecret: process.env.LINE_CHANNEL_SECRET,
    });
};

export async function sendLineMessage(to: string, message: FlexMessage | TextMessage) {
    const client = getLineClient();

    if (!client) {
        console.warn('LINE_CHANNEL_ACCESS_TOKEN or LINE_CHANNEL_SECRET is not set. Skipping LINE notification.');
        return;
    }

    try {
        await client.pushMessage(to, message);
        console.log(`LINE message sent to ${to}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error sending LINE message:', error.originalError?.response?.data || error.message);
        return { success: false, error: error.message };
    }
}

export function createApprovalFlexMessage(
    title: string,
    description: string,
    approvalLink: string,
    imageUrl?: string
): FlexMessage {
    return {
        type: 'flex',
        altText: `ขออนุมัติงานซ่อม: ${title}`,
        contents: {
            type: 'bubble',
            hero: imageUrl ? {
                type: 'image',
                url: imageUrl,
                size: 'full',
                aspectRatio: '20:13',
                aspectMode: 'cover',
                action: {
                    type: 'uri',
                    label: 'ดูรายละเอียด',
                    uri: approvalLink
                }
            } : undefined,
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: 'คำร้องขออนุมัติงานซ่อม',
                        weight: 'bold',
                        size: 'sm',
                        color: '#1DB446'
                    },
                    {
                        type: 'text',
                        text: title,
                        weight: 'bold',
                        size: 'xl',
                        margin: 'md',
                        wrap: true
                    },
                    {
                        type: 'separator',
                        margin: 'md'
                    },
                    {
                        type: 'text',
                        text: description,
                        size: 'sm',
                        color: '#555555',
                        margin: 'md',
                        wrap: true,
                        maxLines: 3
                    }
                ]
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: [
                    {
                        type: 'button',
                        style: 'primary',
                        height: 'sm',
                        action: {
                            type: 'uri',
                            label: 'ตรวจสอบและอนุมัติ',
                            uri: approvalLink
                        },
                        color: '#06C755'
                    },
                    {
                        type: 'text',
                        text: 'กรุณากดปุ่มเพื่อดูรายละเอียดและดำเนินการ',
                        size: 'xs',
                        color: '#aaaaaa',
                        align: 'center',
                        margin: 'md'
                    }
                ],
                paddingAll: 'lg'
            }
        }
    };
}


export function createNotificationFlexMessage({
    title,
    message,
    details = [],
    actionUrl,
    imageUrl,
    color = '#06C755' // LINE Green
}: {
    title: string
    message: string
    details?: { label: string; value: string }[]
    actionUrl?: string
    imageUrl?: string
    color?: string
}): FlexMessage {
    const heroSection = imageUrl ? {
        type: 'image',
        url: imageUrl,
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
        action: actionUrl ? {
            type: 'uri',
            uri: actionUrl
        } : undefined
    } : undefined

    const detailComponents = details.map(detail => ({
        type: 'box',
        layout: 'baseline',
        spacing: 'sm',
        contents: [
            {
                type: 'text',
                text: detail.label,
                color: '#aaaaaa',
                size: 'sm',
                flex: 2 // Label takes less space
            },
            {
                type: 'text',
                text: detail.value,
                wrap: true,
                color: '#666666',
                size: 'sm',
                flex: 4 // Value takes more space
            }
        ]
    }))

    return {
        type: 'flex',
        altText: `${title}: ${message}`,
        contents: {
            type: 'bubble',
            hero: heroSection as any,
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: title,
                        weight: 'bold',
                        color: color,
                        size: 'sm'
                    },
                    {
                        type: 'text',
                        text: message,
                        weight: 'bold',
                        size: 'xl',
                        margin: 'md',
                        wrap: true
                    },
                    detailComponents.length > 0 ? {
                        type: 'separator',
                        margin: 'md'
                    } : undefined,
                    detailComponents.length > 0 ? {
                        type: 'box',
                        layout: 'vertical',
                        margin: 'md',
                        spacing: 'sm',
                        contents: detailComponents as any[]
                    } : undefined
                ].filter(Boolean) as any[]
            },
            footer: actionUrl ? {
                type: 'box',
                layout: 'vertical',
                spacing: 'sm',
                contents: [
                    {
                        type: 'button',
                        style: 'primary',
                        height: 'sm',
                        action: {
                            type: 'uri',
                            label: 'ดูรายละเอียด',
                            uri: actionUrl
                        },
                        color: color
                    }
                ],
                paddingAll: 'lg'
            } : undefined
        }
    }
}
