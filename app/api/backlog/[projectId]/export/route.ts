import { NextRequest, NextResponse } from 'next/server';
import { getBacklogPageData } from '@/lib/backlog/get-page-data';
import { exportBacklogMarkdown } from '@/lib/backlog/export-markdown';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get('format') ?? 'md';

  if (format !== 'md') {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'format must be md',
        },
      },
      { status: 400 }
    );
  }

  const data = await getBacklogPageData(projectId);
  if (!data) {
    return NextResponse.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'project not found',
        },
      },
      { status: 404 }
    );
  }

  const markdown = exportBacklogMarkdown(data);

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="backlog-${data.project.name.replace(/[^\w]+/g, '-').toLowerCase()}.md"`,
    },
  });
}
