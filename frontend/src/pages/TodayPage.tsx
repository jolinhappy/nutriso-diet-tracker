import { getTaipeiToday } from "../lib/date";
import { useUser } from "../hooks/useUser";
import { useTodayMeals } from "../hooks/useTodayMeals";
import ProgressBar from "../components/ProgressBar";
import MealItem from "../components/MealItem";

export default function TodayPage() {
  const today = getTaipeiToday();
  const { data: user } = useUser();
  const { data: record, isLoading, error } = useTodayMeals(today);

  const goals = user?.dailyGoals ?? null;
  const summary = record?.summary;

  return (
    <div className="px-4 pt-5 pb-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-800">今日紀錄</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {today.replace(/-/g, " / ")}
        </p>
      </div>

      {/* Nutrition Summary Card */}
      {!goals ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center space-y-2">
          <p className="text-gray-600 text-sm font-medium">尚未設定每日目標</p>
          <p className="text-gray-400 text-xs">請先前往「設定」頁面設定每日熱量與營養素目標，再開始記錄飲食</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          {/* Calories - larger display */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-sm font-semibold text-gray-700">熱量</span>
              <div className="text-right">
                <span className="text-xl font-bold text-primary-600">
                  {Math.round(summary?.totalCalories ?? 0)}
                </span>
                <span className="text-gray-400 text-sm">
                  {" "}
                  / {goals.calories} kcal
                </span>
              </div>
            </div>
            <ProgressBar
              label=""
              current={summary?.totalCalories ?? 0}
              goal={goals.calories}
              unit=""
              colorClass="bg-primary-500"
            />
          </div>

          <div className="border-t border-gray-50 pt-3 space-y-2.5">
            <ProgressBar
              label="蛋白質"
              current={summary?.totalProtein ?? 0}
              goal={goals.protein}
              unit="g"
              colorClass="bg-blue-400"
            />
            <ProgressBar
              label="碳水化合物"
              current={summary?.totalCarbs ?? 0}
              goal={goals.carbs}
              unit="g"
              colorClass="bg-orange-500"
            />
            <ProgressBar
              label="脂肪"
              current={summary?.totalFat ?? 0}
              goal={goals.fat}
              unit="g"
              colorClass="bg-yellow-500"
            />
          </div>

          {/* Remaining row */}
          {summary && (
            <div className="flex justify-around pt-1 border-t border-gray-50 text-xs text-gray-500">
              <span>
                剩餘熱量{" "}
                <strong className="text-primary-600">
                  {Math.round(summary.remainingCalories)}
                </strong>{" "}
                kcal
              </span>
            </div>
          )}
        </div>
      )}

      {/* Meal List */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2.5">今日餐點</h2>

        {isLoading && (
          <div className="text-center text-gray-400 text-sm py-8">
            載入中...
          </div>
        )}
        {error && (
          <div className="text-center text-error-500 text-sm py-4">
            載入失敗
          </div>
        )}
        {!isLoading &&
          !error &&
          (!record?.meals || record.meals.length === 0) && (
            <div className="text-center text-gray-400 text-sm py-8">
              今日尚無紀錄，傳訊息給 LINE Bot 開始記錄吧！
            </div>
          )}
        {record?.meals && record.meals.length > 0 && (
          <div className="space-y-3">
            {record.meals.map((meal) => (
              <MealItem key={meal.id} meal={meal} date={today} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
