import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, CircleAlert, LoaderCircle, X } from 'lucide-react'

import type {
    Ingredient,
    IngredientFormData,
} from '../types/ingredient'

import type { IngredientCategory } from '../types/ingredient-category'
import type { Unit } from '../types/unit'

import { getUnits } from '../services/unit.service'
import CategorySelect from './CategorySelect'

interface IngredientFormModalProps {
    isOpen: boolean
    ingredient: Ingredient | null
    categories: IngredientCategory[]
    categoriesLoading: boolean
    categoriesError: string | null
    onRetryCategories: () => void
    onClose: () => void
    onSubmit: (formData: IngredientFormData) => Promise<void>
}

const EMPTY_FORM: IngredientFormData = {
    name: '',
    ingredient_category_id: '',
    default_unit_id: '',
    is_allergen: false,
}

export default function IngredientFormModal({
    isOpen,
    ingredient,
    categories,
    categoriesLoading,
    categoriesError,
    onRetryCategories,
    onClose,
    onSubmit,
}: IngredientFormModalProps) {
    const [formData, setFormData] =
        useState<IngredientFormData>(EMPTY_FORM)

    const [formError, setFormError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const [units, setUnits] = useState<Unit[]>([])
    const [unitsLoading, setUnitsLoading] = useState(false)
    const [unitsError, setUnitsError] = useState<string | null>(null)

    const loadUnits = useCallback(async () => {
        setUnitsLoading(true)
        setUnitsError(null)

        try {
            const data = await getUnits()
            setUnits(data)
        } catch (error) {
            setUnitsError(
                error instanceof Error
                    ? error.message
                    : 'Không thể tải danh sách đơn vị.',
            )
        } finally {
            setUnitsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (!isOpen) return

        void loadUnits()
    }, [isOpen, loadUnits])

    useEffect(() => {
        if (!isOpen) return

        const defaultUnitId =
            ingredient?.default_unit_id ??
            units.find(
                (unit) => unit.symbol === ingredient?.default_unit,
            )?.id ??
            units.find((unit) => unit.symbol === 'g')?.id ??
            ''

        setFormData(
            ingredient
                ? {
                    name: ingredient.name,
                    ingredient_category_id:
                        ingredient.ingredient_category_id,
                    default_unit_id: defaultUnitId,
                    is_allergen: ingredient.is_allergen,
                }
                : {
                    ...EMPTY_FORM,
                    default_unit_id:
                        units.find((unit) => unit.symbol === 'g')?.id ??
                        '',
                },
        )

        setFormError(null)
    }, [isOpen, ingredient, units])

    function updateForm<K extends keyof IngredientFormData>(
        field: K,
        value: IngredientFormData[K],
    ) {
        setFormData((current) => ({
            ...current,
            [field]: value,
        }))
    }

    function handleClose() {
        if (saving) return
        onClose()
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setFormError(null)

        const name = formData.name.trim()
        const categoryId = formData.ingredient_category_id
        const defaultUnitId = formData.default_unit_id

        if (!name) {
            setFormError('Vui lòng nhập tên nguyên liệu.')
            return
        }

        if (name.length > 100) {
            setFormError('Tên nguyên liệu không được vượt quá 100 ký tự.')
            return
        }

        if (!categoryId) {
            setFormError('Vui lòng chọn danh mục nguyên liệu.')
            return
        }

        if (!defaultUnitId) {
            setFormError('Vui lòng chọn đơn vị mặc định.')
            return
        }

        if (!units.some((unit) => unit.id === defaultUnitId)) {
            setFormError('Đơn vị mặc định không hợp lệ. Vui lòng chọn lại.')
            return
        }

        const payload: IngredientFormData = {
            name,
            ingredient_category_id: categoryId,
            default_unit_id: defaultUnitId,
            is_allergen: formData.is_allergen,
        }

        try {
            setSaving(true)
            await onSubmit(payload)
            onClose()
        } catch (error) {
            console.error('Failed to save ingredient:', error)

            setFormError(
                error instanceof Error
                    ? error.message
                    : 'Không thể lưu nguyên liệu. Vui lòng thử lại.',
            )
        } finally {
            setSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-0 sm:items-center sm:p-5"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    handleClose()
                }
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="ingredient-form-title"
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream p-5 shadow-xl sm:rounded-3xl sm:p-7"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2
                            id="ingredient-form-title"
                            className="text-xl font-bold text-ink"
                        >
                            {ingredient ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'}
                        </h2>

                        <p className="mt-1 text-sm text-muted">
                            Nhập thông tin để quản lý nguyên liệu trong kho.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={saving}
                        aria-label="Đóng biểu mẫu"
                        className="rounded-lg p-2 text-muted hover:bg-sage/60 disabled:opacity-50"
                    >
                        <X size={19} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                    <div className="space-y-2">
                        <label
                            htmlFor="ingredient-name"
                            className="block text-sm font-medium text-ink"
                        >
                            Tên nguyên liệu{' '}
                            <span className="text-red-500">*</span>
                        </label>

                        <input
                            id="ingredient-name"
                            autoFocus
                            required
                            maxLength={100}
                            value={formData.name}
                            onChange={(event) =>
                                updateForm('name', event.target.value)
                            }
                            placeholder="Ví dụ: Thịt gà"
                            className="w-full rounded-xl border border-beige bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-forest"
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="ingredient-category"
                            className="block text-sm font-medium text-ink"
                        >
                            Danh mục nguyên liệu{' '}
                            <span className="text-red-500">*</span>
                        </label>

                        <CategorySelect
                            id="ingredient-category"
                            ariaLabel="Danh mục nguyên liệu"
                            categories={categories}
                            value={formData.ingredient_category_id}
                            onChange={(value) =>
                                updateForm('ingredient_category_id', value)
                            }
                            placeholder={
                                categoriesLoading
                                    ? 'Đang tải danh mục...'
                                    : 'Chọn danh mục nguyên liệu'
                            }
                            disabled={
                                categoriesLoading ||
                                !!categoriesError ||
                                categories.length === 0
                            }
                            required
                        />

                        {categoriesError ? (
                            <div className="space-y-2">
                                <p role="alert" className="text-xs text-red-600">
                                    {categoriesError}
                                </p>

                                <button
                                    type="button"
                                    onClick={onRetryCategories}
                                    className="text-xs font-semibold text-forest hover:underline"
                                >
                                    Tải lại danh mục
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs text-muted">
                                Chọn danh mục phù hợp với nguyên liệu.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="ingredient-unit"
                            className="block text-sm font-medium text-ink"
                        >
                            Đơn vị mặc định{' '}
                            <span className="text-red-500">*</span>
                        </label>

                        <select
                            id="ingredient-unit"
                            required
                            value={formData.default_unit_id}
                            onChange={(event) =>
                                updateForm(
                                    'default_unit_id',
                                    event.target.value,
                                )
                            }
                            disabled={
                                unitsLoading ||
                                !!unitsError ||
                                units.length === 0
                            }
                            className="w-full rounded-xl border border-beige bg-white px-4 py-3 text-sm text-ink outline-none focus:border-forest disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <option value="">
                                {unitsLoading
                                    ? 'Đang tải đơn vị...'
                                    : unitsError
                                        ? 'Không thể tải đơn vị'
                                        : 'Chọn đơn vị mặc định'}
                            </option>

                            {units.map((unit) => (
                                <option key={unit.id} value={unit.id}>
                                    {unit.name} ({unit.symbol})
                                </option>
                            ))}
                        </select>

                        {unitsError ? (
                            <div className="space-y-2">
                                <p role="alert" className="text-xs text-red-600">
                                    {unitsError}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => void loadUnits()}
                                    disabled={unitsLoading}
                                    className="text-xs font-semibold text-forest hover:underline disabled:opacity-50"
                                >
                                    Tải lại đơn vị
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs text-muted">
                                Chọn đơn vị mặc định dùng để quản lý nguyên liệu.
                            </p>
                        )}
                    </div>

                    <label
                        htmlFor="ingredient-is-allergen"
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                            formData.is_allergen
                                ? 'border-amber-300 bg-amber-50'
                                : 'border-beige bg-white hover:bg-sage/20'
                        }`}
                    >
                        <input
                            id="ingredient-is-allergen"
                            type="checkbox"
                            checked={formData.is_allergen}
                            onChange={(event) =>
                                updateForm(
                                    'is_allergen',
                                    event.target.checked,
                                )
                            }
                            className="mt-1 size-4 shrink-0 accent-forest"
                        />

                        <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                                <AlertTriangle
                                    size={17}
                                    className={
                                        formData.is_allergen
                                            ? 'text-amber-700'
                                            : 'text-muted'
                                    }
                                />
                                Nguyên liệu gây dị ứng
                            </span>

                            <span className="mt-1 block text-xs leading-5 text-muted">
                                Đánh dấu nếu nguyên liệu có thể gây dị ứng, để
                                Bếp Nhà nhận diện khi quản lý món ăn.
                            </span>
                        </span>
                    </label>

                    {formError && (
                        <div
                            role="alert"
                            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700"
                        >
                            <CircleAlert
                                size={17}
                                className="mt-0.5 shrink-0"
                            />
                            <p>{formError}</p>
                        </div>
                    )}

                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={saving}
                            className="rounded-xl border border-beige bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-sage/30 disabled:opacity-50"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            disabled={
                                saving ||
                                categoriesLoading ||
                                !!categoriesError ||
                                categories.length === 0 ||
                                unitsLoading ||
                                !!unitsError ||
                                units.length === 0
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving && (
                                <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                />
                            )}

                            {saving
                                ? 'Đang lưu...'
                                : ingredient
                                    ? 'Lưu thay đổi'
                                    : 'Thêm nguyên liệu'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    )
}
