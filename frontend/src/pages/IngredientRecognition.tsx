
import { useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  Upload,
  X,
  LoaderCircle,
  ScanSearch,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

import { recognizeIngredients } from "../services/ingredient-recognition.service";

import type {
  IngredientRecognitionResponse,
} from "../types/ingredient-recognition";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function IngredientRecognitionPage() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] =
    useState<IngredientRecognitionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  // Tạo và giải phóng URL preview theo vòng đời của file.
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleSelectFile(selectedFile?: File) {
    if (!selectedFile) return;

    setError("");

    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setError("Vui lòng chọn ảnh JPG, PNG hoặc WebP.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("Dung lượng ảnh không được vượt quá 10 MB.");
      return;
    }

    setFile(selectedFile);
    setResult(null);
  }

  async function handleRecognize() {
    if (!file || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await recognizeIngredients(file);
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi nhận diện ảnh."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-8">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-emerald-700">
          <ScanSearch size={24} />
          <span className="text-sm font-semibold">
            BẾP NHÀ AI
          </span>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
          Nhận diện nguyên liệu
        </h1>

        <p className="text-sm text-slate-500">
          Tải ảnh thực phẩm để AI nhận diện nguyên liệu
          và hỗ trợ bạn tìm món ăn phù hợp.
        </p>
      </header>

      {/* Upload và preview */}
      <section
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleSelectFile(event.dataTransfer.files[0]);
        }}
        className={`rounded-2xl border-2 border-dashed p-5 transition sm:p-8 ${
          dragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-slate-200 bg-white"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            handleSelectFile(event.target.files?.[0]);

            // Cho phép chọn lại chính file vừa chọn.
            event.target.value = "";
          }}
        />

        {!preview ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">
              <ImagePlus size={36} />
            </div>

            <div className="space-y-1">
              <h2 className="font-semibold text-slate-800">
                Chọn ảnh nguyên liệu
              </h2>

              <p className="text-sm text-slate-500">
                Kéo thả ảnh vào đây hoặc chọn từ thiết bị.
              </p>

              <p className="text-xs text-slate-400">
                JPG, PNG, WebP · Tối đa 10 MB
              </p>
            </div>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              <Upload size={18} />
              Chọn ảnh
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-800">
                  Ảnh đã chọn
                </h2>

                <p className="truncate text-sm text-slate-500">
                  {file?.name}
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                aria-label="Xóa ảnh"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex justify-center overflow-hidden rounded-xl bg-slate-50 p-2">
              <img
                src={preview}
                alt="Ảnh nguyên liệu được chọn"
                className="max-h-[420px] w-auto max-w-full rounded-lg object-contain"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Đổi ảnh
              </button>

              <button
                type="button"
                onClick={handleRecognize}
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                    Đang nhận diện...
                  </>
                ) : (
                  <>
                    <ScanSearch size={18} />
                    Nhận diện nguyên liệu
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Thông báo lỗi */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={20} className="mt-0.5 shrink-0" />

          <div className="min-w-0">
            <p className="font-semibold">
              Không thể nhận diện ảnh
            </p>
            <p className="mt-1 break-words">{error}</p>
          </div>
        </div>
      )}

      {/* Kết quả */}
      {result && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Kết quả nhận diện
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Tìm thấy {result.count} vật thể trong ảnh.
              </p>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw size={16} />
              Thử ảnh khác
            </button>
          </div>

          {result.count === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
              <AlertCircle
                size={30}
                className="mx-auto mb-3 text-amber-600"
              />

              <h3 className="font-semibold text-slate-800">
                Chưa nhận diện được nguyên liệu
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Hãy thử ảnh rõ nét hơn hoặc chụp nguyên liệu
                trong điều kiện ánh sáng tốt.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.detections.map((detection, index) => (
                  <div
                    key={`${detection.class_id}-${index}`}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                      <CheckCircle2 size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold capitalize text-slate-800">
                        {detection.name.replace(/_/g, " ")}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Độ tin cậy
                      </p>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, detection.confidence * 100)
                            )}%`,
                          }}
                        />
                      </div>

                      <p className="mt-1 text-xs font-medium text-emerald-700">
                        {(detection.confidence * 100).toFixed(2)}%
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        Vị trí: (
                        {detection.box.x1.toFixed(0)},{" "}
                        {detection.box.y1.toFixed(0)}) – (
                        {detection.box.x2.toFixed(0)},{" "}
                        {detection.box.y2.toFixed(0)})
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs leading-5 text-slate-500">
                Độ tin cậy là điểm số của mô hình, không đảm bảo
                kết quả phân loại chính xác. Một lớp nguyên liệu
                có thể xuất hiện nhiều lần nếu phát hiện nhiều
                vật thể cùng loại.
              </p>
            </>
          )}
        </section>
      )}
    </main>
  );
}
