// app/api/user/[username]/page/route.ts
import { getEditorData, getComponentsByType } from '@/lib/services/user.service';
import { isSuccess, failure, success, createNotFoundError } from '@/types/result';
import type { EventComponent, MixsetComponent, User } from '@/types/domain';
import { NextResponse } from 'next/server';

interface PageData {
    user: User;
    events: EventComponent[];
    mixsets: MixsetComponent[];
}

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;

    const editorResult = await getEditorData(username);

    if (!isSuccess(editorResult)) {
        return NextResponse.json(editorResult, { status: getStatusCode(editorResult.error.code) });
    }

    const componentsResult = await getComponentsByType(username);

    if (!isSuccess(componentsResult)) {
        return NextResponse.json(componentsResult, {
            status: getStatusCode(componentsResult.error.code),
        });
    }

    const { user } = editorResult.data;
    const { events, mixsets } = componentsResult.data;

    const response = success<PageData>({ user, events, mixsets });
    return NextResponse.json(response);
}

function getStatusCode(errorCode: string): number {
    switch (errorCode) {
        case 'NOT_FOUND':
            return 404;
        case 'UNAUTHORIZED':
            return 401;
        case 'FORBIDDEN':
            return 403;
        case 'VALIDATION_ERROR':
            return 400;
        case 'CONFLICT':
            return 409;
        default:
            return 500;
    }
}
