import { Injectable } from '@angular/core';
import 'rxjs/add/operator/toPromise';
import { config } from '../../app/app.config';
import { AngularFireOfflineDatabase } from 'angularfire2-offline/database'
import { FirebaseService } from '../../providers/firebase/firebase-service';
import * as _ from 'lodash';

@Injectable()
export class HomeService {
    userDetails: any;
    constructor(public _firebaseService: FirebaseService, public afoDatabase: AngularFireOfflineDatabase) { }

    getHomePageData() {
        this.userDetails = this._firebaseService.getLoggedUser() || JSON.parse(localStorage.getItem('userDetails'));
        return new Promise((resolve, reject) => {
            const homeData = {
                scrubbedIn: 0,
                totalTimeInSurgery: 0,
                totalOperations: 0
            };
            this.afoDatabase.list('/logs', {
                query: {
                    orderByChild: 'uid',
                    equalTo: this.userDetails['uid']
                }
            }).subscribe((res) => {
                homeData['favouriteSpecialities'] = this.getFavouriteSpecialities(res);
                homeData['totalOperations'] = res.length;
                let scrubbedIn = 0;
                let totalTimeInSurgery = 0;
                res.forEach(log => {
                    if (log['scrubbedIn']) {
                        scrubbedIn += 1;
                    }
                    totalTimeInSurgery += this.getTimeDifference(log)
                });
                homeData['scrubbedIn'] = scrubbedIn;
                homeData['totalTimeInSurgery'] = Math.ceil(totalTimeInSurgery / 60);
                resolve(homeData)
            }, (err) => {
                resolve(homeData)
            });
        })
    }

    getTimeDifference(log) {
        const startTime = log['startTime'].split(':');
        const endTime = log['endTime'].split(':');
        return ((endTime[0] * 1 - startTime[0] * 1) * 60) + (endTime[1] * 1 - startTime[1] * 1);
    }

    getFavouriteSpecialities(res) {
        const newData = _.groupBy(res, 'speciality');
        let data = []
        _.forEach(newData, (value, key) => {
            const index = _.findIndex(config['specialityList'], { 'value': key });
            let totalTimeInSurgery = 0;
            _.forEach(value, (value1, key1) => {
                totalTimeInSurgery += this.getTimeDifference(value1);
            })
            data.push({
                showData: config['specialityList'][index],
                totalOperation: value.length,
                totalTimeInSurgery: Math.ceil(totalTimeInSurgery / 60)
            })
        })
        return data;
    }

}
