import { useState } from "react";
import { useAddMeal } from "../hooks/useAddMeal";
import { MealType } from "../hooks/useMealMutations";
import {
  useFoodLibrary,
  useDeleteFoodFromLibrary,
  FoodLibraryItem,
} from "../hooks/useFoodLibrary";

const MEAL_TYPES: MealType[] = ["早餐", "午餐", "晚餐", "點心", "宵夜"];

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  defaultMealType?: MealType;
}

interface FormState {
  mealType: MealType;
  name: string;
  amount: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

const emptyForm = (defaultMealType: MealType = "早餐"): FormState => ({
  mealType: defaultMealType,
  name: "",
  amount: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
});

export default function AddMealModal({
  isOpen,
  onClose,
  date,
  defaultMealType,
}: AddMealModalProps) {
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultMealType));
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [search, setSearch] = useState("");

  const { mutate, isPending } = useAddMeal(date);
  const { data: library = [] } = useFoodLibrary();
  const { mutate: deleteFood } = useDeleteFoodFromLibrary();

  if (!isOpen) return null;

  const filtered = search.trim()
    ? library
        .filter((f) =>
          f.name.toLowerCase().includes(search.trim().toLowerCase()),
        )
        .slice(0, 8)
    : [];

  function handleFormDataChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function applyLibraryItem(item: FoodLibraryItem) {
    setForm((prev) => ({
      ...prev,
      name: item.name,
      amount: item.amount,
      calories: String(item.calories),
      protein: String(item.protein),
      carbs: String(item.carbs),
      fat: String(item.fat),
    }));
    setErrors({});
    setSearch("");
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "請輸入食物名稱";
    if (
      !form.calories ||
      isNaN(Number(form.calories)) ||
      Number(form.calories) < 0
    )
      next.calories = "請輸入有效熱量";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    mutate(
      {
        date,
        mealType: form.mealType,
        item: {
          name: form.name.trim(),
          amount: form.amount.trim(),
          calories: Number(form.calories) || 0,
          protein: Number(form.protein) || 0,
          carbs: Number(form.carbs) || 0,
          fat: Number(form.fat) || 0,
        },
      },
      {
        onSuccess: () => {
          setForm(emptyForm(defaultMealType));
          setErrors({});
          setSearch("");
          onClose();
        },
      },
    );
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-lg bg-white rounded-t-2xl px-4 pt-5 pb-8 max-h-[90vh] overflow-y-auto">
        {/* Handle bar */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        <h2 className="text-base font-bold text-gray-800 mb-3">新增食物</h2>

        {/* 食物庫搜尋 */}
        {library.length > 0 && (
          <div className="mb-4">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M21 21l-4.35-4.35"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="text"
                placeholder="從食物庫快速選擇..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm outline-none focus:border-primary-500"
              />
            </div>

            {filtered.length > 0 && (
              <div className="mt-1 border border-gray-100 rounded-xl overflow-hidden">
                {filtered.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 cursor-pointer ${
                      idx < filtered.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                    onClick={() => applyLibraryItem(item)}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-800 font-medium truncate block">
                        {item.name}
                      </span>
                      {item.amount && (
                        <span className="text-xs text-gray-400">
                          {item.amount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <span className="text-xs text-gray-500">
                        {item.calories} kcal
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFood(item.id);
                        }}
                        className="text-gray-300 hover:text-error-400 transition-colors p-0.5"
                        aria-label="從食物庫移除"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {search.trim() && filtered.length === 0 && (
              <p className="text-xs text-gray-400 mt-1 px-1">
                找不到符合的食物
              </p>
            )}
          </div>
        )}

        {/* 餐別 */}
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            餐別
          </label>
          <div className="flex gap-2 flex-wrap">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleFormDataChange("mealType", type)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  form.mealType === type
                    ? "bg-primary-500 text-white border-primary-500"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 食物名稱 */}
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            食物名稱 <span className="text-error-400">*</span>
          </label>
          <input
            type="text"
            placeholder="例：雞胸肉"
            value={form.name}
            onChange={(e) => handleFormDataChange("name", e.target.value)}
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 ${
              errors.name ? "border-error-400" : "border-gray-200"
            }`}
          />
          {errors.name && (
            <p className="text-xs text-error-400 mt-0.5">{errors.name}</p>
          )}
        </div>

        {/* 份量 */}
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            份量
          </label>
          <input
            type="text"
            placeholder="例：1碗、200ml（選填）"
            value={form.amount}
            onChange={(e) => handleFormDataChange("amount", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500"
          />
        </div>

        {/* 熱量 */}
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            熱量 (kcal) <span className="text-error-400">*</span>
          </label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={form.calories}
            onChange={(e) => handleFormDataChange("calories", e.target.value)}
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 ${
              errors.calories ? "border-error-400" : "border-gray-200"
            }`}
          />
          {errors.calories && (
            <p className="text-xs text-error-400 mt-0.5">{errors.calories}</p>
          )}
        </div>

        {/* 營養素 三欄 */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {(
            [
              {
                field: "protein" as const,
                label: "蛋白質 (g)",
                color: "focus:border-blue-400",
              },
              {
                field: "carbs" as const,
                label: "碳水 (g)",
                color: "focus:border-orange-500",
              },
              {
                field: "fat" as const,
                label: "脂肪 (g)",
                color: "focus:border-yellow-500",
              },
            ] as const
          ).map(({ field, label, color }) => (
            <div key={field}>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                {label}
              </label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={form[field]}
                onChange={(e) => handleFormDataChange(field, e.target.value)}
                className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none ${color}`}
              />
            </div>
          ))}
        </div>

        {/* 按鈕 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 py-3 rounded-xl bg-primary-500 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isPending && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isPending ? "儲存中..." : "新增"}
          </button>
        </div>
      </div>
    </div>
  );
}
