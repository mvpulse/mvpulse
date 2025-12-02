import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, CheckCircle, XCircle } from "lucide-react";

export default function Admin() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-3xl font-display font-bold">Platform Administration</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Flagged Content</CardTitle>
            <ShieldAlert className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Requires review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,394</div>
            <p className="text-xs text-muted-foreground">+120 today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <CheckCircle className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">Operational</div>
            <p className="text-xs text-muted-foreground">Movement Testnet Connected</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Recent Flagged Polls</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Poll ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono text-xs">#8392</TableCell>
                <TableCell>Free Money Giveaway</TableCell>
                <TableCell>Spam / Scam</TableCell>
                <TableCell><Badge variant="destructive">Pending Review</Badge></TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10">Ban</Button>
                  <Button size="sm" variant="ghost">Ignore</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono text-xs">#8391</TableCell>
                <TableCell>Inappropriate Content Poll</TableCell>
                <TableCell>Content Policy</TableCell>
                <TableCell><Badge variant="destructive">Pending Review</Badge></TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10">Ban</Button>
                  <Button size="sm" variant="ghost">Ignore</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
