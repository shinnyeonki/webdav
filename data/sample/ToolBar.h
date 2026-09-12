#pragma once
#include "Container.h"
class ToolBar : public Container
{
public:
	ToolBar();
	void addComponent(Component* p) override;
	bool eventHandler(ActionEvent) override;
	void repaint(HDC) override;

protected:
	list<Component*> tools;
	static int toolNum;
};

