import { useState } from "react";
import { useUser } from "../hooks/useUser";
import { useUpdateGoals, NutritionGoals } from "../hooks/useUpdateGoals";
import PieChart from "../components/PieChart";

export default function SettingsPage() {
  const { data: user, isLoading } = useUser();
  const updateGoals = useUpdateGoals();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<NutritionGoals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [isCaloriesManuallySet, setIsCaloriesManuallySet] = useState(false);
  const [caloriesError, setCaloriesError] = useState<string | null>(null);

  const goals = user?.dailyGoals ?? null;

  function startEditing() {
    if (goals) {
      setForm({ ...goals });
      setIsCaloriesManuallySet(true);
    } else {
      setForm({ calories: 0, protein: 0, carbs: 0, fat: 0 });
      setIsCaloriesManuallySet(false);
    }
    setCaloriesError(null);
    setEditing(true);
  }

  function handleCaloriesChange(value: number) {
    setForm((prev) => ({ ...prev, calories: value }));
    setIsCaloriesManuallySet(true);
    setCaloriesError(null);
  }

  function handleMacroChange(key: "protein" | "carbs" | "fat", value: number) {
    const newForm = { ...form, [key]: value };
    const macroCalories = Math.round(
      newForm.protein * 4 + newForm.carbs * 4 + newForm.fat * 9,
    );

    if (!isCaloriesManuallySet) {
      setForm({ ...newForm, calories: macroCalories });
      setCaloriesError(null);
    } else {
      setForm(newForm);
      if (newForm.calories !== macroCalories) {
        setCaloriesError(
          `三大營養素計算熱量為 ${macroCalories} kcal，與目標熱量 ${newForm.calories} kcal 不符`,
        );
      } else {
        setCaloriesError(null);
      }
    }
  }

  async function handleSave() {
    if (caloriesError) return;
    await updateGoals.mutateAsync(form);
    setEditing(false);
    setCaloriesError(null);
  }

  // Macro calories for pie chart
  const pieSegments = goals
    ? [
        { value: goals.protein * 4, color: "#146AC3", label: "蛋白質" },
        { value: goals.carbs * 4, color: "#F77F00", label: "碳水" },
        { value: goals.fat * 9, color: "#FFD700", label: "脂肪" },
      ]
    : [];

  return (
    <div className="px-4 pt-5 pb-4">
      <h1 className="text-lg font-bold text-gray-800 mb-4">設定</h1>

      {isLoading ? (
        <div className="text-center text-gray-400 text-sm py-8">載入中...</div>
      ) : (
        <>
          {/* No goals state */}
          {!editing && !goals && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center space-y-3">
              <p className="text-gray-600 text-sm font-medium">
                尚未設定每日目標
              </p>
              <p className="text-gray-400 text-xs">
                設定每日熱量與三大營養素目標，才能開始記錄飲食
              </p>
              <button
                onClick={startEditing}
                className="w-full py-2.5 bg-primary-500 text-white rounded-full text-sm font-medium"
              >
                開始設定
              </button>
            </div>
          )}

          {/* Goals display */}
          {!editing && goals && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <div className="flex justify-center">
                <PieChart segments={pieSegments} size={180} />
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800">
                  {goals.calories}
                </p>
                <p className="text-sm text-gray-400">每日目標熱量 kcal</p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-50">
                {[
                  {
                    label: "蛋白質",
                    value: goals.protein,
                    color: "text-blue-500",
                  },
                  {
                    label: "碳水",
                    value: goals.carbs,
                    color: "text-orange-500",
                  },
                  { label: "脂肪", value: goals.fat, color: "text-yellow-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <p className={`text-lg font-bold ${color}`}>{value}g</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={startEditing}
                className="w-full py-2.5 border border-primary-400 text-primary-600 rounded-full text-sm font-medium hover:bg-primary-50 active:bg-primary-100"
              >
                編輯目標
              </button>
            </div>
          )}

          {/* Edit form */}
          {editing && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">
                編輯每日目標
              </h2>
              <div className="space-y-3">
                {/* Calories field */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 w-20 flex-shrink-0">
                      熱量
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.calories || ""}
                      onChange={(e) =>
                        handleCaloriesChange(Number(e.target.value))
                      }
                      className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                        caloriesError
                          ? "border-error-400 focus:ring-error-200"
                          : "border-primary-400 focus:ring-primary-200"
                      }`}
                    />
                    <span className="text-xs text-gray-400 w-8">kcal</span>
                  </div>
                  {caloriesError && (
                    <p className="text-xs text-error-500 pl-[92px]">
                      {caloriesError}
                    </p>
                  )}
                </div>

                {/* Macro fields */}
                {(
                  [
                    {
                      key: "protein",
                      label: "蛋白質",
                      color: "border-blue-300 focus:ring-blue-100",
                    },
                    {
                      key: "carbs",
                      label: "碳水化合物",
                      color: "border-orange-300 focus:ring-orange-100",
                    },
                    {
                      key: "fat",
                      label: "脂肪",
                      color: "border-yellow-300 focus:ring-yellow-100",
                    },
                  ] as const
                ).map(({ key, label, color }) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 w-20 flex-shrink-0">
                      {label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form[key] || ""}
                      onChange={(e) =>
                        handleMacroChange(key, Number(e.target.value))
                      }
                      className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 ${color}`}
                    />
                    <span className="text-xs text-gray-400 w-8">g</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setEditing(false);
                    setCaloriesError(null);
                  }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-full text-sm text-gray-600"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateGoals.isPending || !!caloriesError}
                  className="flex-1 py-2.5 bg-primary-500 text-white rounded-full text-sm font-medium disabled:opacity-50"
                >
                  {updateGoals.isPending ? "儲存中..." : "儲存"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
