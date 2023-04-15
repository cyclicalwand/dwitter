import html
import re2
from string import Template
from typing import Annotated
import json
from dys import _chain, get_script_address, get_caller, BLOCK_INFO
import datetime

CALLER = get_caller() or ""
script_creator = get_script_address()

# Get the time without microseconds
now = datetime.datetime.now()
day = now.day
month = now.month
year = now.year
hour = now.hour
minute = now.minute

date_time_str = f"{day:02d}/{month:02d}/{year}  -  {hour:02d}:{minute:02d}"


def new_post(body: str):
    post_id = str(BLOCK_INFO.height)

    data = {
        "body": body,
        "id": post_id,
        "date": date_time_str,
        "author": CALLER,
    }

    print(data)

    return _chain(
        "dyson/sendMsgCreateStorage",
        creator=script_creator,
        index=script_creator + "/post/" + post_id,
        data=json.dumps(data),
        force=True,
    )


def add_reply(body: str, post_id: str):

    # Query blockchain
    parent_query = _chain(
        "dyson/QueryStorage",
        index=script_creator + "/post/" + post_id,
    )
    if parent_query["error"]:
        return parent_query["error"]
    # get data
    parent_data = json.loads(parent_query["result"]["storage"]["data"])

    # Initialise the replies list if it does not exist
    if "replies" not in parent_data:
        parent_data["replies"] = []
    reply = {
        "body": body,
        "author": CALLER,
        "date": date_time_str,
    }

    parent_data["replies"].append(reply)

    # update chain
    _chain(
        "dyson/sendMsgUpdateStorage",
        creator=script_creator,
        index=script_creator + "/post/" + post_id,
        data=json.dumps(parent_data),
        force=True,
    )


def delete_post(post_id: str):

    parent_query = _chain(
        "dyson/QueryStorage",
        index=script_creator + "/post/" + post_id,
    )
    if parent_query["error"]:
        return parent_query["error"]
    # Get the id of original author
    parent_data = json.loads(parent_query["result"]["storage"]["data"])
    parent_data_author = parent_data.get("author")

    # Check if the caller is original author or script creator
    if CALLER == parent_data_author:
        return _chain(
            "dyson/sendMsgDeleteStorage",
            creator=get_script_address(),
            index=script_creator + "/post/" + post_id,
        )
    elif CALLER == script_creator:
        return _chain(
            "dyson/sendMsgDeleteStorage",
            creator=get_script_address(),
            index=script_creator + "/post/" + post_id,
        )
    else:
        return ["Error, you are not the original author"]


html = [
    Template(
        """
        
        """
    )
    .safe_substitute()
    .encode()
]

def application(environment, start_response):
    start_response("200 OK", [("Content-type", "text/html")])
    return html
