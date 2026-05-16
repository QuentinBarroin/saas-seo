import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getBacklogPageData,
  type BacklogPageData,
} from '@/lib/backlog/get-page-data';
import { exportBacklogMarkdown } from '@/lib/backlog/export-markdown';
import { exportBacklogCsv } from '@/lib/backlog/export-csv';
import { exportBacklogGithub } from '@/lib/backlog/export-github';
import { exportBacklogLinear } from '@/lib/backlog/export-linear';

/** BOM UTF-8 — préfixé aux exports CSV pour qu'Excel lise les accents. */
const UTF8_BOM = '\uFEFF';

const formatSchema = z.enum(['md', 'csv', 'github', 'linear']);
type ExportFormat = z.infer<typeof formatSchema>;

type ExportSpec = {
  render: (data: BacklogPageData) => string;
  contentType: string;
  extension: string;
  /** Suffixe de nom de fichier — distingue les deux exports `.csv`. */
  filenameSuffix: string;
  bom: boolean;
};

const EXPORTERS: Record<ExportFormat, ExportSpec> = {
  md: {
    render: exportBacklogMarkdown,
    contentType: 'text/markdown; charset=utf-8',
    extension: 'md',
    filenameSuffix: '',
    bom: false,
  },
  csv: {
    render: exportBacklogCsv,
    contentType: 'text/csv; charset=utf-8',
    extension: 'csv',
    filenameSuffix: '',
    bom: true,
  },
  github: {
    render: exportBacklogGithub,
    contentType: 'application/json; charset=utf-8',
    extension: 'json',
    filenameSuffix: '-github',
    bom: false,
  },
  linear: {
    render: exportBacklogLinear,
    contentType: 'text/csv; charset=utf-8',
    extension: 'csv',
    filenameSuffix: '-linear',
    bom: true,
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const url = new URL(req.url);

  const parsedFormat = formatSchema.safeParse(
    url.searchParams.get('format') ?? 'md'
  );
  if (!parsedFormat.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'format must be one of: md, csv, github, linear',
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

  const spec = EXPORTERS[parsedFormat.data];
  const body = (spec.bom ? UTF8_BOM : '') + spec.render(data);
  const slug = data.project.name.replace(/[^\w]+/g, '-').toLowerCase();
  const filename = `backlog-${slug}${spec.filenameSuffix}.${spec.extension}`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': spec.contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
