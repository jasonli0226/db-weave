import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

interface ImportSQLModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (sql: string) => void
}

export function ImportSQLModal({
  open,
  onOpenChange,
  onImport,
}: ImportSQLModalProps) {
  const [sqlInput, setSqlInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleImport = () => {
    if (!sqlInput.trim()) {
      setError('Please enter SQL to import')
      return
    }

    try {
      onImport(sqlInput)
      setSqlInput('')
      setError(null)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import SQL')
    }
  }

  const handleCancel = () => {
    setSqlInput('')
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import SQL Schema</DialogTitle>
          <DialogDescription>
            Paste your PostgreSQL SQL here to convert it to text format
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          <Textarea
            value={sqlInput}
            onChange={(e) => {
              setSqlInput(e.target.value)
              setError(null)
            }}
            placeholder="Paste your PostgreSQL SQL here (CREATE TABLE, CREATE TYPE, etc.)..."
            className="flex-1 font-mono text-sm resize-none min-h-[300px]"
          />

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-red-800 font-semibold text-sm">
                  Import Error
                </h4>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-blue-800 font-semibold text-sm mb-1">
              Supported SQL Syntax
            </h4>
            <ul className="text-blue-700 text-xs list-disc list-inside space-y-0.5">
              <li>CREATE TABLE with columns and constraints</li>
              <li>CREATE TYPE ... AS ENUM for enum definitions</li>
              <li>CREATE INDEX for indexes</li>
              <li>PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, DEFAULT</li>
              <li>REFERENCES with ON DELETE/UPDATE actions</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!sqlInput.trim()}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
