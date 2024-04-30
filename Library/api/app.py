import time
from flask import Flask, request, json, jsonify
from flask_cors import CORS
from pymongo import MongoClient, read_concern
from bson import json_util, ObjectId
from datetime import datetime


# client = MongoClient("localhost", 27017)
client = MongoClient("mongodb+srv://yanasheoran:piqzmMWlvD2TglSN@cs348-project.rbqjpeu.mongodb.net/")
db = client.Library
# http://127.0.0.1:5000

app = Flask(__name__)
CORS(app)

# initialize indexes
db.Loans.create_index([("BookID", 1)])
db.Loans.create_index([("ReturnDate", 1), ("DueDate", 1)])


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
    # record['LoanDate'] = datetime.strptime(record['LoanDate'], "%Y-%m-%d")
    # record['DueDate'] = datetime.strptime(record['DueDate'], "%Y-%m-%d")
    if record['ReturnDate']:
        # record['ReturnDate'] = datetime.strptime(record['ReturnDate'], "%Y-%m-%d")
        record['ReturnDate'] = record['ReturnDate']
    else:
        record['ReturnDate'] = ""
        

    db.Loans.insert_one(record)
    return json_util.dumps(record)


# parameterised queries
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


@app.route('/book-report/<book_id>', methods=['GET'])
def book_report(book_id):
    book_id = int(book_id)

    pipeline = [
        {'$match': {'BookID': book_id}},
        {'$lookup': {
            'from': 'Books',
            'localField': 'BookID',
            'foreignField': 'BookID',
            'as': 'BookDetails'
        }},
        {'$unwind': '$BookDetails'},
        {'$group': {
            '_id': '$BookID',
            'BookInfo': {'$first': '$BookDetails'},
            'Loans': {'$push': '$$ROOT'},
            'TotalLoans': {'$sum': 1},
            'LateReturns': {
                '$sum': {
                    '$cond': [
                        {'$and': [
                            {'$ne': ['$ReturnDate', '']},
                            {'$gt': [
                                {'$dateFromString': {'dateString': '$ReturnDate', 'format': "%Y-%m-%d"}},
                                {'$dateFromString': {'dateString': '$DueDate', 'format': "%Y-%m-%d"}}
                            ]}
                        ]},
                        1,
                        0
                    ]
                }
            }
        }},
        {'$addFields': {
            'ValidLoans': {
                '$filter': {
                    'input': '$Loans',
                    'as': 'loan',
                    'cond': {'$ne': ['$$loan.ReturnDate', '']}
                }
            }
        }},
        {'$addFields': {
            'AverageLoanDuration': {
                '$cond': {
                    'if': {'$eq': [{'$size': '$ValidLoans'}, 0]},
                    'then': "Currently on loan",
                    'else': {
                        '$avg': {
                            '$map': {
                                'input': '$ValidLoans',
                                'as': 'loan',
                                'in': {'$divide': [
                                    {'$subtract': [
                                        {'$dateFromString': {'dateString': '$$loan.ReturnDate', 'format': "%Y-%m-%d"}},
                                        {'$dateFromString': {'dateString': '$$loan.LoanDate', 'format': "%Y-%m-%d"}}
                                    ]},
                                    1000 * 60 * 60 * 24  # Convert milliseconds to days
                                ]}
                            }
                        }
                    }
                }
            }
        }}
    ]

    result = list(db.Loans.aggregate(pipeline))
    if not result:
        return json_util.dumps({"message": "No data found for this book ID."})

    response = {
        'BookDetails': result[0]['BookInfo'],
        'LoansDetails': result[0]['Loans'],
        'TotalLoans': result[0]['TotalLoans'],
        'LateReturns': result[0]['LateReturns'],
        'AverageLoanDuration': result[0]['AverageLoanDuration']
    }

    return json_util.dumps(response, default=json_util.default)
