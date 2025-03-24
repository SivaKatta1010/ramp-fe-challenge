import { Fragment, useCallback, useEffect, useMemo, useState} from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, loading: employeesLoading, fetchAll, invalidateData: invalidateEmployees } = useEmployees()
  const { data: paginatedTransactions, loading: transactionsLoading, fetchAll: fetchAllTransactions, invalidateData: invalidateTransactions } = usePaginatedTransactions()
  const { data: transactionsByEmployee, fetchById } = useTransactionsByEmployee()
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    if (!employees) {
      await fetchAll()
    }
    setSelectedEmployeeId("") 
    invalidateTransactions() 
    await fetchAllTransactions() 
  }, [invalidateTransactions, fetchAllTransactions])
  

  const loadTransactionsByEmployee = useCallback(async (employeeId: string) => {
    invalidateTransactions()
    await fetchById(employeeId)
  }, [invalidateTransactions, fetchById])

  const loadMoreTransactions = useCallback(async () => {
    if (paginatedTransactions?.nextPage != null) {
      await fetchAllTransactions()
    }
  }, [paginatedTransactions, fetchAllTransactions])

  useEffect(() => {
    if (employees === null && !employeesLoading) {
      loadAllTransactions()
    }
  }, [employees, employeesLoading, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={employeesLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees ? [EMPTY_EMPLOYEE, ...employees] : []}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) return
          
            if (newValue.id !== "") {
              setSelectedEmployeeId(newValue.id)
              await loadTransactionsByEmployee(newValue.id)
            } else {
              await loadAllTransactions()
            }
          }}          
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />
          
          {!selectedEmployeeId && paginatedTransactions?.nextPage != null && (
            <button
              className="RampButton"
              onClick={async () => {
                await loadMoreTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}