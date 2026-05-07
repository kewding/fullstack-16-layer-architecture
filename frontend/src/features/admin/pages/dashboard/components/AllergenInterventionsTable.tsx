import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import type { AllergenInterventionsData } from '../services/dashboard.service';

interface AllergenTableProps {
  data: AllergenInterventionsData | null;
  loading: boolean;
}

export default function AllergenInterventionsTable({ data, loading }: AllergenTableProps) {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">
          Recent Allergen Interventions
        </CardTitle>
        <p className="text-xs text-gray-400">Blocked purchases within selected range</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[270px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Time</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Item</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Allergen</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stall</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && !data ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 animate-pulse rounded bg-gray-100" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data?.data.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-gray-400">
                    No allergen interventions in this period.
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((row, i) => (
                  <TableRow key={i} className="hover:bg-gray-50">
                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                      {format(parseISO(row.time), 'MMM d, h:mm a')}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-800">{row.product_name}</TableCell>
                    <TableCell>
                      <Badge className="bg-red-100 text-red-700 text-xs">{row.allergen}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{row.stall_name}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}