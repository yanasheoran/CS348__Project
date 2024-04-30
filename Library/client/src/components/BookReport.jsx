import React, { useState, useEffect } from 'react';
import './BookReport.css'; // Import CSS for styling

export default function BookReport() {
    const [bookId, setBookId] = useState('');
    const [report, setReport] = useState(null);
    const [books, setBooks] = useState([]);

    useEffect(() => {
        async function fetchBooks() {
            const response = await fetch(`https://noble-hydra-421901.uc.r.appspot.com/get_books`);
            const bookList = await response.json();
            setBooks(bookList);
        }
        fetchBooks();
    }, []);

    useEffect(() => {
        const fetchBookReport = async () => {
            if (!bookId) return;  // Prevents fetching if no book ID is selected
            const url = `https://noble-hydra-421901.uc.r.appspot.com/book-report/${bookId}`;
            try {
                const response = await fetch(url);
                const data = await response.json();
                setReport(data);
            } catch (error) {
                console.error('Failed to fetch book report:', error);
            }
        };

        fetchBookReport();
    }, [bookId]);

    return (
        <div>
            <select
                name="BookID"
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                required
            >
                <option value="">Select Book</option>
                {books.map((book) => (
                    <option key={book.BookID} value={book.BookID}>
                        {book.Title}
                    </option>
                ))}
            </select>
            {report && (
                <div className="report-container">
                    <div className="summary-box">
                        <h3>Report Summary:</h3>
                        <p>Total Loans: {report.TotalLoans}</p>
                        <p>Late Returns: {report.LateReturns}</p>
                        <p>Average Loan Duration: {report.AverageLoanDuration} {report.AverageLoanDuration != 'Currently on loan' && (<>days</>)}</p>
                    </div>
                    {report.LoansDetails && report.LoansDetails.length > 0 ? (
                        <div className="loans-table">
                            <h4>Loan Details:</h4>
                            <table>
                                <thead>
                                    <tr>
                                        {/* <th>Loan ID</th> */}
                                        <th>Member ID</th>
                                        <th>Loan Date</th>
                                        <th>Due Date</th>
                                        <th>Return Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.LoansDetails.map((loan, index) => (
                                        <tr key={index}>
                                            {/* <td>{loan.LoanID}</td> */}
                                            <td>{loan.MemberID}</td>
                                            <td>{loan.LoanDate}</td>
                                            <td>{loan.DueDate}</td>
                                            <td>{loan.ReturnDate || 'Currently on loan'}</td>
                                            <td>{loan.Status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p>No loans found for this book.</p>
                    )}
                </div>
            )}
        </div>
    );
}
