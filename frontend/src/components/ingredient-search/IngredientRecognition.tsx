import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
    AlertCircle,
    Check,
    ImagePlus,
    LoaderCircle,
    ScanSearch,
    Sparkles,
    Trash2,
    Upload,
    X,
} from 'lucide-react'

import { recognizeIngredients } from '../../services/ingredient-recognition.service'
import {
    resolveIngredientLabels,
    type ResolvedIngredientLabel,
} from '../../services/ingredient-label.service'
import type { IngredientDetection } from '../../types/ingredient-recognition'

export interface RecognitionItem extends ResolvedIngredientLabel {
    confidence: number
}

interface RecognitionFile {
    id: string
    file: File
    previewUrl: string
}

interface IngredientRecognitionProps {
    onAddIngredients: (items: RecognitionItem[]) => void
    selectedIds: string[]
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function IngredientRecognition({
    onAddIngredients,
    selectedIds,
}: IngredientRecognitionProps) {
    const [files, setFiles] = useState<RecognitionFile[]>([])
    const [items, setItems] = useState<RecognitionItem[]>([])
    const [checkedLabels, setCheckedLabels] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hasRecognized, setHasRecognized] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const filesRef = useRef<RecognitionFile[]>([])
    const requestIdRef = useRef(0)

    useEffect(() => {
        filesRef.current = files
    }, [files])

    useEffect(() => {
        return () => {
            // Thu hồi URL ảnh khi component bị hủy.
            filesRef.current.forEach((item) => {
                URL.revokeObjectURL(item.previewUrl)
            })
        }
    }, [])

    function clearRecognitionResults() {
        setItems([])
        setCheckedLabels([])
        setHasRecognized(false)
        setError(null)
    }

    function addFiles(event: ChangeEvent<HTMLInputElement>) {
        const input = event.target
        const incomingFiles = Array.from(input.files ?? [])

        // Cho phép chọn lại chính file vừa chọn.
        input.value = ''

        if (incomingFiles.length === 0) return

        const validFiles: File[] = []
        const errors: string[] = []

        for (const file of incomingFiles) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                errors.push(`${file.name}: chỉ hỗ trợ JPG, PNG hoặc WebP.`)
                continue
            }

            if (file.size > MAX_FILE_SIZE) {
                errors.push(`${file.name}: ảnh không được vượt quá 10 MB.`)
                continue
            }

            validFiles.push(file)
        }

        if (validFiles.length === 0) {
            setError(errors.join(' '))
            return
        }

        const newFiles = validFiles.map((file) => ({
            id: crypto.randomUUID(),
            file,
            previewUrl: URL.createObjectURL(file),
        }))

        setFiles((current) => [...current, ...newFiles])

        // Có ảnh mới thì kết quả nhận diện cũ không còn đại diện
        // cho toàn bộ danh sách ảnh nữa.
        clearRecognitionResults()

        setError(errors.length > 0 ? errors.join(' ') : null)
    }

    function removeFile(id: string) {
        const target = filesRef.current.find((item) => item.id === id)

        if (target) {
            URL.revokeObjectURL(target.previewUrl)
        }

        setFiles((current) => current.filter((item) => item.id !== id))
        clearRecognitionResults()
    }

    function clearAllFiles() {
        filesRef.current.forEach((item) => {
            URL.revokeObjectURL(item.previewUrl)
        })

        setFiles([])
        clearRecognitionResults()

        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    async function handleRecognize() {
        if (files.length === 0) {
            setError('Bạn hãy chọn ít nhất một ảnh nguyên liệu trước nhé.')
            return
        }

        const currentRequestId = ++requestIdRef.current

        try {
            setLoading(true)
            setError(null)
            clearRecognitionResults()

            // Nhận diện tuần tự từng ảnh để tránh gửi quá nhiều
            // yêu cầu YOLO cùng lúc.
            const allDetections: IngredientDetection[] = []
            const failedFiles: string[] = []

            for (const selectedFile of files) {
                try {
                    const response = await recognizeIngredients(selectedFile.file)
                    allDetections.push(...response.detections)
                } catch {
                    failedFiles.push(selectedFile.file.name)
                }
            }

            if (currentRequestId !== requestIdRef.current) return

            if (allDetections.length === 0) {
                setHasRecognized(true)

                if (failedFiles.length === files.length) {
                    setError(
                        'Không thể nhận diện các ảnh đã chọn. Vui lòng kiểm tra kết nối dịch vụ AI và thử lại.',
                    )
                } else if (failedFiles.length > 0) {
                    setError(
                        `Không nhận diện được nguyên liệu trong các ảnh thành công. Các ảnh bị lỗi: ${failedFiles.join(', ')}.`,
                    )
                } else {
                    setError(
                        'YOLO chưa nhận diện được nguyên liệu nào trong các ảnh. Hãy thử ảnh rõ hơn.',
                    )
                }

                return
            }

            // Mỗi label chỉ ánh xạ một lần, kể cả khi xuất hiện
            // ở nhiều ảnh khác nhau.
            const labels = [
                ...new Set(
                    allDetections
                        .map((detection) => detection.name.trim())
                        .filter(Boolean),
                ),
            ]

            const resolved = await resolveIngredientLabels(labels)

            if (currentRequestId !== requestIdRef.current) return

            const resolvedByLabel = new Map(
                resolved.map((item) => [item.label.toLowerCase(), item]),
            )

            // Nếu một nguyên liệu xuất hiện trong nhiều ảnh,
            // giữ độ tin cậy cao nhất của label đó.
            const confidenceByLabel = new Map<string, number>()

            for (const detection of allDetections) {
                const label = detection.name.trim()
                if (!label) continue

                const key = label.toLowerCase()
                const previous = confidenceByLabel.get(key) ?? 0

                confidenceByLabel.set(
                    key,
                    Math.max(previous, detection.confidence),
                )
            }

            const nextItems: RecognitionItem[] = labels.map((label) => {
                const mapped = resolvedByLabel.get(label.toLowerCase())

                return {
                    label,
                    ingredient_id: mapped?.ingredient_id ?? null,
                    ingredient_name: mapped?.ingredient_name ?? null,
                    matched: Boolean(
                        mapped?.matched &&
                        mapped.ingredient_id !== null &&
                        mapped.ingredient_name,
                    ),
                    confidence: confidenceByLabel.get(label.toLowerCase()) ?? 0,
                }
            })

            setItems(nextItems)

            setCheckedLabels(
                nextItems
                    .filter(
                        (item) =>
                            item.matched &&
                            item.ingredient_id !== null &&
                            !selectedIds.includes(String(item.ingredient_id)),
                    )
                    .map((item) => item.label),
            )

            setHasRecognized(true)

            const messages: string[] = []

            if (failedFiles.length > 0) {
                messages.push(
                    `Không xử lý được ${failedFiles.length} ảnh: ${failedFiles.join(', ')}.`,
                )
            }

            if (!nextItems.some((item) => item.matched)) {
                messages.push(
                    'Các label nhận diện được chưa ánh xạ sang nguyên liệu trong kho.',
                )
            }

            setError(messages.length > 0 ? messages.join(' ') : null)
        } catch (err) {
            if (currentRequestId !== requestIdRef.current) return

            setError(
                err instanceof Error
                    ? err.message
                    : 'Không thể nhận diện nguyên liệu. Vui lòng thử lại.',
            )
        } finally {
            if (currentRequestId === requestIdRef.current) {
                setLoading(false)
            }
        }
    }

    function toggleLabel(label: string) {
        setCheckedLabels((current) =>
            current.includes(label)
                ? current.filter((item) => item !== label)
                : [...current, label],
        )
    }

    function handleAdd() {
        const selected = items.filter(
            (item) =>
                item.matched &&
                item.ingredient_id !== null &&
                checkedLabels.includes(item.label),
        )

        if (selected.length === 0) {
            setError('Hãy chọn ít nhất một nguyên liệu đã nhận diện.')
            return
        }

        // Thêm vào danh sách nguyên liệu của trang.
        // Không ghi trực tiếp vào database.
        onAddIngredients(selected)

        // Xóa ảnh và kết quả AI sau khi xác nhận thêm.
        clearAllFiles()
    }

    const matchedCount = items.filter(
        (item) => item.matched && item.ingredient_id !== null,
    ).length

    const addableCount = items.filter(
        (item) =>
            item.matched &&
            item.ingredient_id !== null &&
            checkedLabels.includes(item.label) &&
            !selectedIds.includes(String(item.ingredient_id)),
    ).length

    return (
        <section className="mb-6 rounded-2xl border border-sage/70 bg-cream/50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage/60 text-forest">
                    <ScanSearch size={21} />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-ink">
                            Nhận diện nguyên liệu bằng AI
                        </h3>

                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-medium text-forest">
                            <Sparkles size={12} />
                            v1.0.0-beta.1
                        </span>
                    </div>

                    <p className="mt-1 text-sm leading-5 text-muted">
                        Chọn một hoặc nhiều ảnh nguyên liệu. AI sẽ gộp các nguyên liệu
                        nhận diện được để bạn kiểm tra trước khi thêm vào danh sách tìm món.
                    </p>
                </div>
            </div>

            <div className="mt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink">
                        Ảnh đã chọn: {files.length}
                    </p>

                    {files.length > 0 && (
                        <button
                            type="button"
                            onClick={clearAllFiles}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted transition hover:bg-white hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Trash2 size={14} />
                            Xóa tất cả ảnh
                        </button>
                    )}
                </div>

                {files.length > 0 ? (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {files.map((item) => (
                            <div
                                key={item.id}
                                className="relative overflow-hidden rounded-xl border border-sage bg-white"
                            >
                                <img
                                    src={item.previewUrl}
                                    alt={item.file.name}
                                    className="h-32 w-full object-contain p-1"
                                />

                                <button
                                    type="button"
                                    onClick={() => removeFile(item.id)}
                                    disabled={loading}
                                    aria-label={`Xóa ảnh ${item.file.name}`}
                                    title="Xóa ảnh"
                                    className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <X size={15} />
                                </button>

                                <p
                                    title={item.file.name}
                                    className="truncate border-t border-beige px-2 py-1.5 text-xs text-muted"
                                >
                                    {item.file.name}
                                </p>
                            </div>
                        ))}

                        {/* Ô thêm ảnh mới */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                            className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-sage bg-white p-4 text-center text-muted transition hover:border-forest hover:bg-sage/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ImagePlus size={28} className="text-forest" />
                            <span className="text-sm font-semibold text-ink">
                                Thêm ảnh
                            </span>
                            <span className="text-xs">
                                Chọn thêm nguyên liệu
                            </span>
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="group mt-3 flex min-h-48 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sage bg-white px-5 py-8 text-center transition hover:border-forest hover:bg-sage/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-sage/40 text-forest transition group-hover:bg-sage">
                            <ImagePlus size={30} />
                        </div>

                        <span className="mt-3 font-semibold text-ink">
                            Chọn ảnh nguyên liệu
                        </span>

                        <span className="mt-1 text-sm text-muted">
                            Nhấn vào đây để tải ảnh lên
                        </span>

                        <span className="mt-2 text-xs text-muted">
                            Có thể chọn nhiều ảnh cùng lúc
                        </span>

                        <span className="mt-1 text-xs text-muted">
                            JPG, PNG hoặc WebP · Tối đa 10 MB mỗi ảnh
                        </span>
                    </button>
                )}


                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="sr-only"
                    onChange={addFiles}
                />

                <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-beige bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Upload size={17} />
                        {files.length > 0 ? 'Chọn thêm ảnh' : 'Chọn ảnh'}
                    </button>

                    <button
                        type="button"
                        onClick={() => void handleRecognize()}
                        disabled={files.length === 0 || loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? (
                            <LoaderCircle size={17} className="animate-spin" />
                        ) : (
                            <ScanSearch size={17} />
                        )}
                        {loading ? 'Đang nhận diện...' : 'Nhận diện nguyên liệu'}
                    </button>
                </div>

                <p className="mt-3 text-xs leading-5 text-muted">
                    Chỉ hỗ trợ JPG, PNG và WebP; mỗi ảnh tối đa 10 MB. Nguyên liệu chỉ
                    được thêm vào danh sách sau khi bạn xác nhận, không tự động lưu vào kho.
                </p>
            </div>

            {error && (
                <div
                    role="alert"
                    className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                >
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {hasRecognized && items.length > 0 && (
                <div className="mt-5 border-t border-beige pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h4 className="font-semibold text-ink">
                                Kết quả nhận diện
                            </h4>

                            <p className="mt-1 text-xs text-muted">
                                {matchedCount} label đã ánh xạ được nguyên liệu trong kho
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={addableCount === 0}
                            className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Check size={17} />
                            Thêm nguyên liệu đã chọn
                        </button>
                    </div>

                    <div className="mt-3 space-y-2">
                        {items.map((item) => {
                            const canAdd =
                                item.matched && item.ingredient_id !== null

                            const alreadySelected =
                                canAdd &&
                                selectedIds.includes(String(item.ingredient_id))

                            return (
                                <label
                                    key={item.label}
                                    className={`flex items-start gap-3 rounded-xl border p-3 ${canAdd
                                            ? 'cursor-pointer border-beige bg-white'
                                            : 'border-amber-100 bg-amber-50/70'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checkedLabels.includes(item.label)}
                                        disabled={!canAdd}
                                        onChange={() => toggleLabel(item.label)}
                                        className="mt-1 size-4 accent-forest"
                                    />

                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-medium text-ink">
                                            {item.ingredient_name ?? item.label}
                                        </span>

                                        <span className="mt-1 block text-xs text-muted">
                                            Label YOLO: {item.label}
                                            {' · '}
                                            Độ tin cậy: {(item.confidence * 100).toFixed(1)}%
                                        </span>

                                        {!canAdd && (
                                            <span className="mt-1 block text-xs text-amber-800">
                                                Chưa có ánh xạ trong kho nguyên liệu
                                            </span>
                                        )}

                                        {alreadySelected && (
                                            <span className="mt-1 block text-xs text-forest">
                                                Đã có trong danh sách nguyên liệu được chọn
                                            </span>
                                        )}
                                    </span>
                                </label>
                            )
                        })}
                    </div>
                </div>
            )}
        </section>
    )
}
