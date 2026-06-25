import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  X,
  FileIcon as FileComponent,
  Wrench,
  SplitSquareHorizontal,
  Merge,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { useToast } from '../hooks/use-toast';
import ColumnAvailabilityBadges from './ColumnAvailabilityBadges';
import { parseSpreadsheetFile, type SpreadsheetFileExtension } from '../utils/spreadsheetParser';
import {
  validateProfileColumns,
  rowHasLinkedIn,
  type ProfileColumnValidation,
  type SpreadsheetRow,
} from '../utils/spreadsheetColumns';
import {
  downloadOutputFiles,
  downloadOutputFile,
  prepareNormalizedRows,
  splitNormalizedRows,
  stitchNormalizedRows,
  DEFAULT_SPLIT_ROWS_PER_FILE,
} from '../utils/spreadsheetSplitStitch';

type UtilsMode = 'split' | 'stitch';
type FileExtension = SpreadsheetFileExtension;

const ACCEPTED_EXTENSIONS: FileExtension[] = ['csv', 'xlsx'];

interface ParsedFileEntry {
  file: File;
  data: SpreadsheetRow[];
  validation: ProfileColumnValidation;
}

const getFileExtension = (file: File): FileExtension | null => {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.xlsx')) return 'xlsx';
  return null;
};

const getFileStem = (file: File): string => {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.xlsx')) return file.name.slice(0, -5);
  if (lower.endsWith('.csv')) return file.name.slice(0, -4);
  return file.name;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / 1048576)} MB`;
};

interface ExtensionSwitcherProps {
  value: FileExtension;
  onChange: (ext: FileExtension) => void;
}

const ExtensionSwitcher: React.FC<ExtensionSwitcherProps> = ({ value, onChange }) => (
  <div className="flex shrink-0 rounded-lg border border-border-elevated bg-card-elevated p-0.5">
    {ACCEPTED_EXTENSIONS.map((ext) => (
      <button
        key={ext}
        type="button"
        onClick={() => onChange(ext)}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide transition-all duration-200 ${
          value === ext
            ? 'bg-primary text-white shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-card'
        }`}
      >
        {ext}
      </button>
    ))}
  </div>
);

const UtilsCard: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<UtilsMode>('split');
  const [splitEntry, setSplitEntry] = useState<ParsedFileEntry | null>(null);
  const [stitchEntries, setStitchEntries] = useState<ParsedFileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const [splitOutputStem, setSplitOutputStem] = useState('');
  const [splitOutputExt, setSplitOutputExt] = useState<FileExtension>('csv');
  const [splitRowsPerFile, setSplitRowsPerFile] = useState(DEFAULT_SPLIT_ROWS_PER_FILE);
  const [stitchOutputStem, setStitchOutputStem] = useState('merged');
  const [stitchOutputExt, setStitchOutputExt] = useState<FileExtension>('xlsx');
  const [removeRowsWithoutLinkedin, setRemoveRowsWithoutLinkedin] = useState(true);

  const itemAnimation = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  const resetOutputNames = () => {
    setSplitOutputStem('');
    setSplitOutputExt('csv');
    setSplitRowsPerFile(DEFAULT_SPLIT_ROWS_PER_FILE);
    setStitchOutputStem('merged');
    setStitchOutputExt('xlsx');
    setRemoveRowsWithoutLinkedin(true);
  };

  const handleModeChange = (value: UtilsMode) => {
    setMode(value);
    setSplitEntry(null);
    setStitchEntries([]);
    setIsDragging(false);
    setDragCounter(0);
    resetOutputNames();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const showInvalidFileToast = () => {
    toast({
      title: 'Invalid file format',
      description: 'Please upload a .csv or .xlsx file only',
      variant: 'destructive',
    });
  };

  const parseAndStore = async (file: File): Promise<ParsedFileEntry | null> => {
    const ext = getFileExtension(file);
    if (!ext) {
      showInvalidFileToast();
      return null;
    }

    try {
      const data = await parseSpreadsheetFile(file);
      const validation = validateProfileColumns(data);
      return { file, data, validation };
    } catch {
      toast({
        title: 'Parsing error',
        description: 'Could not read the uploaded file',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleSplitFileSelect = async (file: File) => {
    setIsParsing(true);
    const entry = await parseAndStore(file);
    setIsParsing(false);
    if (!entry) return;

    setSplitEntry(entry);
    setSplitOutputStem(getFileStem(file));
    setSplitOutputExt(getFileExtension(file) || 'csv');

    if (!entry.validation.isValid) {
      toast({
        title: 'Missing required columns',
        description: 'Need N, C, and P (Name, Company, Position). W and L are optional.',
        variant: 'destructive',
      });
    }
  };

  const handleStitchFilesSelect = async (files: FileList | File[]) => {
    setIsParsing(true);
    const incoming = Array.from(files);
    const parsed: ParsedFileEntry[] = [];

    for (const file of incoming) {
      const entry = await parseAndStore(file);
      if (entry) parsed.push(entry);
    }

    setIsParsing(false);
    if (!parsed.length) return;

    setStitchEntries((prev) => {
      const existing = new Set(prev.map((entry) => `${entry.file.name}-${entry.file.size}`));
      const merged = [...prev];
      parsed.forEach((entry) => {
        const key = `${entry.file.name}-${entry.file.size}`;
        if (!existing.has(key)) merged.push(entry);
      });
      return merged;
    });

    const invalid = parsed.filter((entry) => !entry.validation.isValid);
    if (invalid.length) {
      toast({
        title: 'Some files missing required columns',
        description: 'Each file needs N, C, and P. W and L are optional.',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    if (mode === 'split') {
      await handleSplitFileSelect(files[0]);
    } else {
      await handleStitchFilesSelect(files);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => {
      const next = prev - 1;
      if (next <= 0) setIsDragging(false);
      return next;
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    const files = e.dataTransfer.files;
    if (!files.length) return;

    if (mode === 'split') {
      await handleSplitFileSelect(files[0]);
    } else {
      await handleStitchFilesSelect(files);
    }
  };

  const clearSplitFile = () => {
    setSplitEntry(null);
    setSplitOutputStem('');
    setSplitOutputExt('csv');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeStitchFile = (index: number) => {
    setStitchEntries((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (!next.length) {
        setStitchOutputStem('merged');
        setStitchOutputExt('xlsx');
      }
      return next;
    });
  };

  const clearStitchFiles = () => {
    setStitchEntries([]);
    setStitchOutputStem('merged');
    setStitchOutputExt('xlsx');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const uploadHint =
    mode === 'split'
      ? 'Upload one .csv or .xlsx file. Required columns: N, C, P. Optional: W, L.'
      : 'Upload one or more .csv or .xlsx files. Each needs N, C, P. Optional: W, L.';

  const hasFiles = mode === 'split' ? !!splitEntry : stitchEntries.length > 0;
  const splitPatternStem = splitOutputStem.trim() || 'output';
  const splitPattern = `${splitPatternStem}-{}.${splitOutputExt}`;
  const splitExample = `${splitPatternStem}-1.${splitOutputExt}, ${splitPatternStem}-2.${splitOutputExt}, …`;
  const stitchStem = stitchOutputStem.trim() || 'merged';
  const stitchOutputName = `${stitchStem}.${stitchOutputExt}`;

  const splitReady = !!splitEntry?.validation.isValid;
  const stitchReady = stitchEntries.length > 0 && stitchEntries.every((entry) => entry.validation.isValid);
  const effectiveRowsPerFile = Math.max(1, Math.floor(splitRowsPerFile) || DEFAULT_SPLIT_ROWS_PER_FILE);
  const splitChunkCount = splitEntry
    ? Math.ceil(splitEntry.data.length / effectiveRowsPerFile)
    : 0;

  const stitchMergedRows = stitchReady
    ? stitchEntries.flatMap((entry) => prepareNormalizedRows(entry.data, entry.validation))
    : [];
  const stitchTotalRows = stitchMergedRows.length;
  const stitchLinkedInRows = stitchMergedRows.filter(rowHasLinkedIn).length;
  const stitchWithoutLinkedInRows = stitchTotalRows - stitchLinkedInRows;
  const stitchOutputRowCount = removeRowsWithoutLinkedin ? stitchLinkedInRows : stitchTotalRows;

  const renderFileRow = (
    entry: ParsedFileEntry,
    onRemove: () => void,
    removeLabel: string
  ) => (
    <div className="p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <FileComponent className="text-accent shrink-0 h-5 w-5" />
        <div className="flex-grow min-w-0">
          <p className="text-primary-text font-medium text-sm truncate">{entry.file.name}</p>
          <p className="text-secondary-text text-xs">
            {entry.data.length} row{entry.data.length !== 1 ? 's' : ''} · {formatFileSize(entry.file.size)} ·{' '}
            {getFileExtension(entry.file)?.toUpperCase()}
          </p>
        </div>
        <ColumnAvailabilityBadges validation={entry.validation} variant="icons" />
        <button
          type="button"
          className="text-secondary-text hover:text-destructive shrink-0 p-0.5"
          onClick={onRemove}
          aria-label={removeLabel}
        >
          <X size={18} />
        </button>
      </div>
      {!entry.validation.isValid && (
        <div className="flex items-start gap-2 p-2 mt-2 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
          <span className="text-xs text-destructive">Missing required columns (N, C, P).</span>
        </div>
      )}
    </div>
  );

  const fileSectionLabel = mode === 'split' ? 'Select file to split' : 'Select files to stitch';

  const handleDownloadClick = async () => {
    try {
      setIsDownloading(true);

      if (mode === 'split') {
        if (!splitEntry || !splitReady) {
          toast({
            title: 'Cannot split yet',
            description: 'Upload a valid file with N, C, and P columns.',
            variant: 'destructive',
          });
          return;
        }

        const normalized = prepareNormalizedRows(splitEntry.data, splitEntry.validation);
        const outputs = await splitNormalizedRows(
          normalized,
          splitPatternStem,
          splitOutputExt,
          effectiveRowsPerFile
        );
        await downloadOutputFiles(outputs);

        toast({
          title: 'Split complete',
          description: `Downloaded ${outputs.length} file${outputs.length !== 1 ? 's' : ''} with full column headers.`,
        });
        return;
      }

      if (!stitchReady) {
        toast({
          title: 'Cannot stitch yet',
          description: 'Every file must have N, C, and P columns.',
          variant: 'destructive',
        });
        return;
      }

      const merged = stitchEntries.flatMap((entry) =>
        prepareNormalizedRows(entry.data, entry.validation)
      );
      const filtered = removeRowsWithoutLinkedin ? merged.filter(rowHasLinkedIn) : merged;

      if (!filtered.length) {
        toast({
          title: 'No rows to export',
          description: removeRowsWithoutLinkedin
            ? 'No rows with LinkedIn found across the selected files.'
            : 'No data rows to stitch.',
          variant: 'destructive',
        });
        return;
      }

      const output = await stitchNormalizedRows([filtered], stitchOutputName, stitchOutputExt);
      downloadOutputFile(output);

      toast({
        title: 'Stitch complete',
        description: `Downloaded ${stitchOutputName} (${filtered.length} row${filtered.length !== 1 ? 's' : ''}).`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Download failed',
        description: 'Something went wrong while building the file.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
      }}
    >
      <motion.div variants={itemAnimation} className="space-y-3">
        <Label className="text-sm">Utility mode</Label>
        <div className="flex w-full bg-card-elevated rounded-2xl p-1.5 border border-border-elevated">
          <button
            type="button"
            onClick={() => handleModeChange('split')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
              mode === 'split'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-card'
            }`}
          >
            <SplitSquareHorizontal className="h-4 w-4" />
            <span>Split</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('stitch')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
              mode === 'stitch'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-card'
            }`}
          >
            <Merge className="h-4 w-4" />
            <span>Stitch</span>
          </button>
        </div>
        <p className="text-secondary-text text-xs sm:text-sm">
          {mode === 'split'
            ? `Split into chunks (${DEFAULT_SPLIT_ROWS_PER_FILE} rows/file default). CSV = plain; XLSX = profile search table style.`
            : 'Combine files into one output. CSV = plain; XLSX = profile search table style.'}
        </p>
      </motion.div>

      <motion.div variants={itemAnimation}>
        <div className="flex items-center justify-between gap-3 mb-2">
          <Label className="text-sm">{fileSectionLabel}</Label>
          {hasFiles && (
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <ColumnAvailabilityBadges variant="headers" />
              <span className="w-[26px] shrink-0" aria-hidden />
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          id="utils-file-input"
          className="hidden"
          accept=".csv,.xlsx"
          multiple={mode === 'stitch'}
          onChange={handleInputChange}
        />

        {isParsing ? (
          <div className="border border-border rounded-lg p-6 flex items-center justify-center gap-2 text-secondary-text">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Reading file…</span>
          </div>
        ) : !hasFiles ? (
          <div
            className={`border-2 border-dashed rounded-lg p-4 sm:p-5 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center ${
              isDragging
                ? 'border-accent bg-accent/10 scale-[1.02]'
                : 'border-border hover:border-accent/50 hover:bg-accent/5'
            }`}
            onClick={openFilePicker}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-200 ${
                isDragging ? 'bg-accent/20 scale-110' : 'bg-accent/10'
              }`}
            >
              <Upload
                className={`h-4 w-4 sm:h-5 sm:w-5 transition-all duration-200 ${
                  isDragging ? 'text-accent scale-110 animate-bounce' : 'text-accent'
                }`}
              />
            </div>
            <p className="text-secondary-text text-xs sm:text-sm mb-3">
              {isDragging ? 'Drop your file(s) here to upload' : uploadHint}
            </p>
            <Button
              type="button"
              size="sm"
              className="bg-accent/20 hover:bg-accent/30 text-accent hover:text-primary-text border border-accent/40 h-9 px-3 sm:px-4"
              onClick={(event) => {
                event.stopPropagation();
                openFilePicker();
              }}
            >
              <FileComponent className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Browse Files
            </Button>
          </div>
        ) : mode === 'split' && splitEntry ? (
          <div className="bg-background/70 rounded-lg border border-border">
            {renderFileRow(splitEntry, clearSplitFile, 'Remove file')}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-background/70 rounded-lg border border-border divide-y divide-border">
              {stitchEntries.map((entry, index) => (
                <div key={`${entry.file.name}-${entry.file.size}-${index}`}>
                  {renderFileRow(entry, () => removeStitchFile(index), `Remove ${entry.file.name}`)}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-accent/40 text-accent hover:bg-accent/10"
                onClick={openFilePicker}
              >
                <Upload className="mr-2 h-4 w-4" />
                Add more files
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-border text-secondary-text hover:text-destructive hover:border-destructive/40"
                onClick={clearStitchFiles}
              >
                Clear all
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {mode === 'split' && splitEntry && (
        <motion.div variants={itemAnimation} className="space-y-3">
          <div>
            <Label htmlFor="split-output-stem" className="text-sm">
              Output filename pattern
            </Label>
            <p className="text-secondary-text text-xs sm:text-sm mt-1">
              Edit the base name — chunk numbers are added before the extension (e.g.{' '}
              <span className="text-foreground font-medium">{splitExample}</span>).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="flex flex-1 items-center gap-0 rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background">
              <Input
                id="split-output-stem"
                value={splitOutputStem}
                onChange={(e) => setSplitOutputStem(e.target.value)}
                placeholder="File name"
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
              />
              <span className="shrink-0 px-2 sm:px-3 text-sm text-muted-foreground bg-muted/40 border-l border-input h-10 flex items-center">
                -{}.
              </span>
            </div>
            <ExtensionSwitcher value={splitOutputExt} onChange={setSplitOutputExt} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="split-rows-per-file" className="text-sm">
              Rows per file
            </Label>
            <p className="text-secondary-text text-xs sm:text-sm">
              Data rows in each chunk (header row is separate). Default matches desktop tool:{' '}
              {DEFAULT_SPLIT_ROWS_PER_FILE}.
            </p>
            <Input
              id="split-rows-per-file"
              type="number"
              min={1}
              step={1}
              value={splitRowsPerFile}
              onChange={(e) => {
                const next = parseInt(e.target.value, 10);
                setSplitRowsPerFile(Number.isFinite(next) && next > 0 ? next : DEFAULT_SPLIT_ROWS_PER_FILE);
              }}
              className="max-w-[10rem] bg-background"
            />
            {splitEntry && (
              <p className="text-xs text-muted-foreground">
                {splitEntry.data.length} data rows → {splitChunkCount} file
                {splitChunkCount !== 1 ? 's' : ''} at {effectiveRowsPerFile} rows each
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-background/50 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Preview pattern</p>
            <p className="text-sm font-medium text-foreground font-mono break-all">{splitPattern}</p>
          </div>
        </motion.div>
      )}

      {mode === 'stitch' && stitchEntries.length > 0 && (
        <motion.div variants={itemAnimation} className="space-y-3">
          <div className="rounded-lg border border-border bg-background/50 px-3 py-3 sm:px-4 space-y-3">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <p className="text-foreground">
                <span className="text-muted-foreground">Total combined rows:</span>{' '}
                <span className="font-semibold">{stitchTotalRows}</span>
              </p>
              <p className="text-foreground">
                <span className="text-muted-foreground">Without LinkedIn:</span>{' '}
                <span className="font-semibold">{stitchWithoutLinkedInRows}</span>
              </p>
              <p className="text-foreground">
                <span className="text-muted-foreground">Output rows:</span>{' '}
                <span className="font-semibold text-primary">{stitchOutputRowCount}</span>
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border/50 bg-background/40">
              <div className="min-w-0">
                <p className="text-sm font-medium text-primary-text">Remove rows without LinkedIn</p>
                <p className="text-xs text-secondary-text mt-0.5">
                  Only keep rows that have a value in the L column after stitching.
                </p>
              </div>
              <Switch
                checked={removeRowsWithoutLinkedin}
                onCheckedChange={setRemoveRowsWithoutLinkedin}
                aria-label="Remove rows without LinkedIn"
                className="flex-shrink-0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="stitch-output-stem" className="text-sm">
              Output filename
            </Label>
            <p className="text-secondary-text text-xs sm:text-sm mt-1">
              Name for the combined file after stitching.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="flex flex-1 items-center gap-0 rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background">
              <Input
                id="stitch-output-stem"
                value={stitchOutputStem}
                onChange={(e) => setStitchOutputStem(e.target.value)}
                placeholder="File name"
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
              />
              <span className="shrink-0 px-2 sm:px-3 text-sm text-muted-foreground bg-muted/40 border-l border-input h-10 flex items-center">
                .
              </span>
            </div>
            <ExtensionSwitcher value={stitchOutputExt} onChange={setStitchOutputExt} />
          </div>

          <div className="rounded-lg border border-border bg-background/50 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Preview</p>
            <p className="text-sm font-medium text-foreground font-mono break-all">{stitchOutputName}</p>
          </div>
        </motion.div>
      )}

      {hasFiles && (
        <motion.div variants={itemAnimation} className="pt-2">
          <Button
            type="button"
            className="w-full h-11 bg-primary hover:bg-accent-hover text-white shadow-lg shadow-primary/20"
            onClick={handleDownloadClick}
            disabled={
              isDownloading ||
              (mode === 'split' ? !splitReady : !stitchReady || stitchOutputRowCount === 0)
            }
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {mode === 'split' ? 'Download split files' : 'Download stitched file'}
          </Button>
          <p className="text-xs text-secondary-text text-center mt-2">
            {mode === 'split'
              ? `Output: ${splitPattern} · ${effectiveRowsPerFile} rows/file · full headers on export`
              : `Output: ${stitchOutputName} · ${stitchOutputRowCount} row${stitchOutputRowCount !== 1 ? 's' : ''} (${stitchTotalRows} combined, ${stitchWithoutLinkedInRows} without LinkedIn)`}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default UtilsCard;
