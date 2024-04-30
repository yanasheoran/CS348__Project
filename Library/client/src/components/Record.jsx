import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function Record() {
  const [form, setForm] = useState({
    BookID: "",
    MemberID: "",
    LoanDate: "",
    DueDate: "",
    ReturnDate: "",
    Status: "",
  });
  const [isNew, setIsNew] = useState(true);
  const params = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);

  useEffect(() => {
    async function populate_arrays() {
      const response = await fetch(`https://noble-hydra-421901.uc.r.appspot.com/get_members`);
      const memberList = await response.json();
      setMembers(memberList);
      const response2 = await fetch(`https://noble-hydra-421901.uc.r.appspot.com/get_books`);
      const bookList = await response2.json();
      setBooks(bookList);
    }
    populate_arrays();
  }, []);


  useEffect(() => {
    async function fetchData() {
      const id = params.id?.toString() || undefined;
      if (!id) return;
      setIsNew(false);
      const response = await fetch(
        `https://noble-hydra-421901.uc.r.appspot.com/fetch_record/${params.id.toString()}`
      );
      if (!response.ok) {
        const message = `An error has occurred: ${response.statusText}`;
        console.error(message);
        return;
      }
      const record = await response.json();
      if (!record) {
        console.warn(`Record with id ${id} not found`);
        navigate("/");
        return;
      }
      setForm(record);
    }
    fetchData();
    return;
  }, [params.id, navigate]);

  // These methods will update the state properties.
  function updateForm(value) {
    console.log(form)
    return setForm((prev) => {
      return { ...prev, ...value };
    });

  }

  // This function will handle the submission.
  async function onSubmit(e) {
    e.preventDefault();
    const record = { ...form };
    record.LoanID = parseInt(record.LoanID);
    record.MemberID = parseInt(record.MemberID);
    record.BookID = parseInt(record.BookID);
    console.log("re", record);

    try {
      let response;
      if (isNew) {
        // if we are adding a new record we will POST to /record.
        response = await fetch("https://noble-hydra-421901.uc.r.appspot.com/post_record", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(record),
        });
      } else {
        // if we are updating a record we will PATCH to /record/:id.
        response = await fetch(`https://noble-hydra-421901.uc.r.appspot.com/update_record/${params.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(record),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('A problem occurred with your fetch operation: ', error);
    } finally {
      setForm({
        BookID: "",
        MemberID: "",
        LoanDate: "",
        DueDate: "",
        ReturnDate: "",
        Status: "",
      });
      navigate("/");
    }
  }

  // This following section will display the form that takes the input from the user.
  return (
    <>
      <h3 className="text-lg font-semibold p-4">Create/Update Library Record</h3>
      <form
        onSubmit={onSubmit}
        className="border rounded-lg overflow-hidden p-4"
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-b border-slate-900/10 pb-12 md:grid-cols-2">
          <div>
            <h2 className="text-base font-semibold leading-7 text-slate-900">
              Loan Information
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Enter the details

            </p>
          </div>
          {/* list out all members in dropdown */}
          <select
            name="MemberID"
            value={form.MemberID}
            onChange={(e) => updateForm({ MemberID: e.target.value })}
            required
          >
            <option value="">Select Member</option>
            {members.map((member) => (
              <option key={member.MemberID} value={member.MemberID}>
                {member.Name}
              </option>
            ))}
          </select>

          {/* list out all books in dropdown */}
          <select
            name="BookID"
            value={form.BookID}
            onChange={(e) => updateForm({ BookID: e.target.value })}
            required
          >
            <option value="">Select Book</option>
            {books.map((book) => (
              <option key={book.BookID} value={book.BookID}>
                {book.Title}
              </option>
            ))}
          </select>



          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 ">
            <div className="sm:col-span-4">
              <label
                htmlFor="LoanDate"
                className="block text-sm font-medium leading-6 text-slate-900"
              >
                Loan Date
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input
                    type="date"
                    name="LoanDate"
                    id="LoanDate"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6"
                    value={form.LoanDate}
                    onChange={(e) => {
                      const newLoanDate = new Date(e.target.value);
                      const dueDate = new Date(newLoanDate.setFullYear(newLoanDate.getFullYear() + 1));
                      const formattedDueDate = (newLoanDate.getMonth() + 1).toString().padStart(2, '0') + 
                                     '/' + (newLoanDate.getDate()+1).toString().padStart(2, '0') + 
                                     '/' + newLoanDate.getFullYear();
                      updateForm({ LoanDate: e.target.value, DueDate: dueDate.toISOString().split('T')[0], formattedDueDate: formattedDueDate });
                    }}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="DueDate"
                className="block text-sm font-medium leading-6 text-slate-900"
              >
                Due Date
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input
                    type="text"
                    readOnly
                    name="DueDate"
                    id="DueDate"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6"
                    value={
                      form.formattedDueDate ? form.formattedDueDate : ''}
                      // form.DueDate ? new Date(form.DueDate).toISOString().split('T')[0] : ''}
                    placeholder="Due Date will be displayed here"
                  />
                </div>
              </div>
            </div>


            {form.Status === "Returned" && (<div className="sm:col-span-4">
              <label
                htmlFor="ReturnDate"
                className="block text-sm font-medium leading-6 text-slate-900"
              >
                Return Date
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input
                    type="date"
                    name="ReturnDate"
                    id="ReturnDate"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-slate-900 placeholder:text-slate-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="Developer Advocate"
                    value={form.ReturnDate}
                    onChange={(e) => updateForm({ ReturnDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            )}

            <div>
              <fieldset className="mt-4">
                <legend className="sr-only">Status Options</legend>
                <div className="space-y-4 sm:flex sm:items-center sm:space-x-10 sm:space-y-0">
                  <div className="flex items-center">
                    <input
                      id="StatusOnLoan"
                      name="StatusOptions"
                      type="radio"
                      value="On Loan"
                      className="h-4 w-4 border-slate-300 text-slate-600 focus:ring-slate-600 cursor-pointer"
                      checked={form.Status === "On Loan"}
                      onChange={(e) => updateForm({ Status: e.target.value })}
                    />
                    <label
                      htmlFor="positionIntern"
                      className="ml-3 block text-sm font-medium leading-6 text-slate-900 mr-4"
                    >
                      On Loan
                    </label>
                    <input
                      id="StatusReturned"
                      name="StatusOptions"
                      type="radio"
                      value="Returned"
                      className="h-4 w-4 border-slate-300 text-slate-600 focus:ring-slate-600 cursor-pointer"
                      checked={form.Status === "Returned"}
                      onChange={(e) => updateForm({ Status: e.target.value })}
                      required
                    />
                    <label
                      htmlFor="positionReturned"
                      className="ml-3 block text-sm font-medium leading-6 text-slate-900 mr-4"
                    >
                      Returned
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>
          </div>
        </div>
        <input
          type="submit"
          value="Save Library Record"
          className="inline-flex items-center justify-center whitespace-nowrap text-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-slate-100 hover:text-accent-foreground h-9 rounded-md px-3 cursor-pointer mt-4"
        />
      </form>
    </>
  );
}