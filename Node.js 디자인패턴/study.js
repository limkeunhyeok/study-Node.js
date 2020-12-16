socketA, pipeB;
watchedList.add(socketA, FOR_READ);
watchedList.add(pipeB, FOR_READ);
while(events = demultiplexer.watch(watchedList)) {
    foreach(event in events) {
        data = event.resource.read();
        if(data === RESOURCE_CLOSED)
            demultiplexer.unwatch(event.resource);
        else
            consumeData(data);
    }
}