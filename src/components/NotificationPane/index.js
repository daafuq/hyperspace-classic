import React, { Component } from 'react';
import { ActivityItem, Link } from "office-ui-fabric-react";
import ReplyWindow from '../ReplyWindow';
import moment from 'moment';

class NotificationPane extends Component {

    client;
    notifListener;

    constructor(props){
        super(props);

        this.client = this.props.client;

        this.state = {
            notifications: []
        }


    }

    componentDidMount() {
        let _this = this;

        this.notifListener = this.client.stream('/streaming/user');

        this.notifListener.on('connect', () => {
            this.client.get('/notifications', {limit: 7})
                .then((resp) => {
                    _this.setState({
                        notifications: resp.data
                    })
                });
        });

        this.notifListener.on('notification', (notification) => {
            let notif_set = _this.state.notifications;
            notif_set.unshift(notification);
            notif_set.splice(-1, 1);
            _this.setState({
                notifications: notif_set
            })

            this.sendDesktopNotification(notification)

        })

    }

    sendDesktopNotification(notification) {


        let notif = window.Notification || window.mozNotification || window.webkitNotification;

        if ('undefined' === typeof notification)
            console.log('Notifications aren\'t supported on this browser.');
        else
            notif.requestPermission(function (permission) { });


        let title = notification.account.display_name;
        let body = "";
        if (notification.type === "follow") {
            title += " followed you.";
        } else if (notification.type === "mention") {
            title += " mentioned you in a status.";
        } else if (notification.type === "favourite") {
            title += " favorited your status.";
        } else if (notification.type === "reblog") {
            title += " boosted your status."
        }

        if (notification.status != null || notification.status != undefined) {
            let tempDivElement = document.createElement('tempDiv');
            tempDivElement.innerHTML = notification.status.content;
            body = tempDivElement.textContent || tempDivElement.innerText || "";
        }

        let desktop_notification = new Notification(title, {
            body: body
        })
    }

    getActivityDescription(type) {
        if (type === "follow") {
            return <span><b>followed</b> you.</span>;
        } else if (type === "favourite") {
            return <span><b>favorited</b> your status.</span>;
        } else if (type === "mention") {
            return <span><b>mentioned</b> you in a status.</span>;
        } else if (type === "reblog") {
            return <span><b>boosted</b> your status.</span>;
        }
    }

    getActivityComment(status, type) {
        let _this = this;
        if (status === null || status === undefined) {
            return '';
        } else {
            return (
                <div>
                    <span className="my-2" dangerouslySetInnerHTML={{__html: status.content}}/>
                    {
                        type === "mention" ?
                            <ReplyWindow status={status} client={this.client} fullButton={false}/>:
                            <span></span>
                    }
                </div>
            );
        }
    }

    getActivityDate(date) {
        return moment(date).format("MMM Do, YYYY [at] h:mm A");
    }

    createActivityList() {
        let _this = this;
        if (_this.state.notifications.length > 0) {
            return (_this.state.notifications.map((notification) => {
                let activityKey = [{
                    key: notification.id,
                    activityDescription: [
                        <span>
                            <a href={notification.account.url}><b>{notification.account.display_name}</b></a>
                            <span>
                                &nbsp;{this.getActivityDescription(notification.type)}
                            </span>
                        </span>

                    ]
                }];
                return(
                    <ActivityItem
                        activityDescription={activityKey[0].activityDescription}
                        activityPersonas={[{
                            imageUrl: notification.account.avatar
                        }]}
                        comments={this.getActivityComment(notification.status, notification.type)}
                        timeStamp={this.getActivityDate(notification.created_at)}
                        className="mt-2"
                        key={notification.id}
                    />
                );
            }));
        } else {
            return (<div>
                <h6>Couldn't get notifications</h6>
                <p>
                    And the fediverse isn't the same without you. Try checking your internet connection or making sure you aren't being throttled.
                </p>
            </div>);
        }
    }

    render(){
        return (
            <div className = "container-fluid shadow rounded mt-4 p-4 marked-area">
                <h5><b>Notifications</b></h5>
                {this.createActivityList()}
            </div>
        );
    }

}

export default NotificationPane;