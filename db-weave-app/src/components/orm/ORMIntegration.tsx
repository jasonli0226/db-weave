import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText } from 'lucide-react';
import { API_BASE_URL, API_PREFIX } from '@/api/ai';

interface ORMIntegrationProps {
  dbWeaveText: string;
}

export function ORMIntegration({ dbWeaveText }: ORMIntegrationProps) {
  const [generatedCode, setGeneratedCode] = useState<{
    prisma?: string;
    typeorm?: string;
    sequelize?: string;
    graphql?: string;
  }>({});

  const generateORMCode = async () => {
    try {
      // In a real implementation, this would call the backend API
      // For now, we'll simulate the generation
      const response = await fetch(`${API_BASE_URL}${API_PREFIX}/api/orm/generate-orm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schema: dbWeaveText }),
      });

      if (response.ok) {
        const code = await response.json();
        setGeneratedCode(code);
      }
    } catch (error) {
      console.error('Failed to generate ORM code:', error);
    }
  };

  const downloadCode = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          ORM Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={generateORMCode} className="w-full">
            Generate ORM Code
          </Button>

          {Object.keys(generatedCode).length > 0 && (
            <Tabs defaultValue="prisma" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="prisma">Prisma</TabsTrigger>
                <TabsTrigger value="typeorm">TypeORM</TabsTrigger>
                <TabsTrigger value="sequelize">Sequelize</TabsTrigger>
                <TabsTrigger value="graphql">GraphQL</TabsTrigger>
              </TabsList>

              <TabsContent value="prisma" className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Prisma Schema</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCode(generatedCode.prisma || '', 'schema.prisma')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-96">
                  {generatedCode.prisma}
                </pre>
              </TabsContent>

              <TabsContent value="typeorm" className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">TypeORM Entities</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCode(generatedCode.typeorm || '', 'entities.ts')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-96">
                  {generatedCode.typeorm}
                </pre>
              </TabsContent>

              <TabsContent value="sequelize" className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Sequelize Models</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCode(generatedCode.sequelize || '', 'models.js')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-96">
                  {generatedCode.sequelize}
                </pre>
              </TabsContent>

              <TabsContent value="graphql" className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">GraphQL Schema</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCode(generatedCode.graphql || '', 'schema.graphql')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-96">
                  {generatedCode.graphql}
                </pre>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
    </Card>
  );
}