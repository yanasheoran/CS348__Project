import time
from flask import Flask, request
from flask_cors import CORS
from pymongo import MongoClient
from bson import json_util, ObjectId
from datetime import datetime


client = MongoClient("localhost", 27017)
db = client.Library
# http://127.0.0.1:5000

app = Flask(__name__)
CORS(app)


@app.route('/get_loans')
def get_loans():
    loans = db.Loans.find()
    loans = [loan for loan in loans]
    return json_util.dumps(loans)

@app.route('/get_books')
def get_books():
    books = db.Books.find()
    books = [book for book in books]
    return json_util.dumps(books)

@app.route('/get_members')
def get_members():
    members = db.Members.find()
    members = [member for member in members]
    return json_util.dumps(members)

@app.route('/post_record', methods=['POST'])
def post_record():
    record = request.json
    db.Loans.insert_one(record)
    return json_util.dumps(record)

@app.route('/delete_record/<_id>', methods=['DELETE'])
def delete_record(_id):
    _id = ObjectId(_id)
    db.Loans.delete_one({"_id": _id})
    return json_util.dumps({"message": "Record deleted"})


@app.route('/fetch_record/<_id>', methods=['GET'])
def fetch_record(_id):
    _id = ObjectId(_id)
    record = db.Loans.find_one({"_id": _id})
    if record:
        return json_util.dumps(record)
    else:
        return json_util.dumps({"message": "Record not found"})
    
@app.route('/update_record/<_id>', methods=['PATCH'])
def update_record(_id):
    _id = ObjectId(_id)
    record = request.json
    record.pop("_id")
    db.Loans.update_one({"_id": _id}, {"$set": record})
    return json_util.dumps(record)


from datetime import datetime

@app.route('/book-report/<book_id>', methods=['GET'])
def book_report(book_id):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    # Convert date strings to datetime objects, if provided
    if start_date and end_date:
        start_date = datetime.strptime(start_date, "%Y-%m-%d")
        end_date = datetime.strptime(end_date, "%Y-%m-%d")

        query = {
            'BookID': book_id,
            'LoanDate': {'$gte': start_date, '$lte': end_date}
        }
    else:
        query = {'BookID': book_id}

    loans = db.Loans.find(query)
    loans_list = [loan for loan in loans]

    # Calculate statistics
    total_loans = len(loans_list)
    late_returns = sum(1 for loan in loans_list if loan.get('ReturnDate') and loan['ReturnDate'] > loan['DueDate'])
    average_loan_duration = sum((loan['ReturnDate'] - loan['LoanDate']).days for loan in loans_list if loan.get('ReturnDate')) / total_loans if total_loans > 0 else 0

    response = {
        'total_loans': total_loans,
        'late_returns': late_returns,
        'average_loan_duration': average_loan_duration,
    }

    return json_util.dumps(response)

