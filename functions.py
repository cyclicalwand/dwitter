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
reply_id_str = f"{day:02d}{month:02d}{year}{hour:02d}{minute:02d}"


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
        #   "reply_id": reply_id_str,
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


def delete_replies(post_id: str, reply_id: str):

    # Retrieve the parent data object
    parent_query = _chain(
        "dyson/QueryStorage",
        index=script_creator + "/post/" + post_id,
    )
    if parent_query["error"]:
        return parent_query["error"]
    # Get the data from stotrage
    parent_data = json.loads(parent_query["result"]["storage"]["data"])

    # Find the matching reply
    reply_index = None
    for i, reply in enumerate(parent_data["replies"]):
        if reply["reply_id"] == reply_id:
            reply_index = i
            break

    if reply_index is not None:
        original_author = parent_data["replies"][reply_index]["author"]

        # Check if the caller is authorized to delete the reply
        if CALLER == script_creator:
            # Update the reply fields
            parent_data["replies"][reply_index][
                "body"
            ] = "This message was deleted by admin"
            parent_data["replies"][reply_index]["author"] = "Deleted"
            parent_data["replies"][reply_index]["date"] = "N/A"

            return _chain(
                "dyson/sendMsgUpdateStorage",
                creator=script_creator,
                index=script_creator + "/post/" + post_id,
                data=json.dumps(parent_data),
            )
        elif CALLER == original_author:
            # Update the reply fields
            parent_data["replies"][reply_index][
                "body"
            ] = "This message has been deleted"
            parent_data["replies"][reply_index]["author"] = "Deleted"
            parent_data["replies"][reply_index]["date"] = "N/A"

            return _chain(
                "dyson/sendMsgUpdateStorage",
                creator=script_creator,
                index=script_creator + "/post/" + post_id,
                data=json.dumps(parent_data),
            )
        else:
            return "Error: You are not authorized to delete this reply."

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
